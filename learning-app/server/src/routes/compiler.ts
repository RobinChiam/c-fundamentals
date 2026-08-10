import type { FastifyInstance } from "fastify";
import {
  compileRequestSchema,
  compileResponseSchema,
  compilerStatusSchema,
} from "@learning-app/shared";
import { LessonNotFoundError } from "../curriculum/curriculum-service.js";
import {
  CompileInternalError,
  CompilerUnavailableError,
  InvalidWorkspaceError,
  PayloadTooLargeError,
} from "../compiler/compiler-errors.js";
import { COMPILE_BODY_LIMIT_BYTES } from "../compiler/compiler-limits.js";
import type { CompilerService } from "../compiler/compiler-service.js";

export async function registerCompilerRoutes(
  app: FastifyInstance,
  compilerService: CompilerService,
): Promise<void> {
  app.get("/api/compiler/status", async () => {
    const status = await compilerService.getStatus();
    return compilerStatusSchema.parse(status);
  });

  app.post<{ Params: { lessonId: string } }>(
    "/api/lessons/:lessonId/compile",
    {
      bodyLimit: COMPILE_BODY_LIMIT_BYTES,
    },
    async (request, reply) => {
      let body: unknown = request.body;
      const parsedBody = compileRequestSchema.safeParse(body);
      if (!parsedBody.success) {
        return reply.status(400).send({ error: "Invalid compile request" });
      }

      try {
        const response = await compilerService.compileLesson(
          request.params.lessonId,
          parsedBody.data,
        );
        return compileResponseSchema.parse(response);
      } catch (error) {
        if (error instanceof LessonNotFoundError) {
          return reply.status(404).send({ error: "Lesson not found" });
        }
        if (
          error instanceof InvalidWorkspaceError ||
          error instanceof PayloadTooLargeError
        ) {
          return reply.status(400).send({ error: error.message });
        }
        if (error instanceof CompilerUnavailableError) {
          return reply.status(503).send({ error: error.message });
        }
        if (error instanceof CompileInternalError) {
          request.log.error(error);
          return reply.status(500).send({ error: "Compile service error" });
        }
        throw error;
      }
    },
  );
}
