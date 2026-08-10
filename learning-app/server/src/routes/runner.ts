import type { FastifyInstance } from "fastify";
import { runRequestSchema, runResponseSchema, runnerStatusSchema } from "@learning-app/shared";
import { LessonNotFoundError } from "../curriculum/curriculum-service.js";
import {
  InvalidWorkspaceError,
  PayloadTooLargeError,
} from "../compiler/compiler-errors.js";
import { RunInternalError, RunnerUnavailableError } from "../runner/runner-errors.js";
import { RUN_BODY_LIMIT_BYTES } from "../runner/runner-config.js";
import type { RunnerService } from "../runner/runner-service.js";

export async function registerRunnerRoutes(
  app: FastifyInstance,
  runnerService: RunnerService,
): Promise<void> {
  app.get("/api/runner/status", async () => {
    const status = await runnerService.getStatus();
    return runnerStatusSchema.parse(status);
  });

  app.post<{ Params: { lessonId: string } }>(
    "/api/lessons/:lessonId/run",
    {
      bodyLimit: RUN_BODY_LIMIT_BYTES,
    },
    async (request, reply) => {
      const parsedBody = runRequestSchema.safeParse(request.body);
      if (!parsedBody.success) {
        return reply.status(400).send({ error: "Invalid run request" });
      }

      try {
        const response = await runnerService.runLesson(
          request.params.lessonId,
          parsedBody.data,
        );
        return runResponseSchema.parse(response);
      } catch (error) {
        if (error instanceof LessonNotFoundError) {
          return reply.status(404).send({ error: "Lesson not found" });
        }
        if (
          error instanceof InvalidWorkspaceError ||
          error instanceof PayloadTooLargeError
        ) {
          const statusCode =
            error instanceof PayloadTooLargeError ? 413 : 400;
          return reply.status(statusCode).send({ error: error.message });
        }
        if (error instanceof RunnerUnavailableError) {
          return reply.status(503).send({ error: error.message });
        }
        if (error instanceof RunInternalError) {
          request.log.error(error);
          return reply.status(500).send({ error: "Run service error" });
        }
        throw error;
      }
    },
  );
}
