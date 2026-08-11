import type { FastifyInstance } from "fastify";
import { lessonArchitectureResponseSchema } from "@learning-app/shared";
import { LessonNotFoundError } from "../curriculum/curriculum-service.js";
import {
  ArchitectureNotSupportedError,
  type ArchitectureService,
} from "../architecture/architecture-service.js";

export async function registerArchitectureRoutes(
  app: FastifyInstance,
  architectureService: ArchitectureService,
): Promise<void> {
  app.get<{ Params: { lessonId: string } }>(
    "/api/lessons/:lessonId/architecture",
    async (request, reply) => {
      const { lessonId } = request.params;

      try {
        const architecture =
          await architectureService.getLessonArchitecture(lessonId);
        return lessonArchitectureResponseSchema.parse(architecture);
      } catch (error) {
        if (error instanceof LessonNotFoundError) {
          return reply.status(404).send({ error: "Lesson not found" });
        }
        if (error instanceof ArchitectureNotSupportedError) {
          return reply
            .status(404)
            .send({ error: "Architecture not supported for this lesson" });
        }
        throw error;
      }
    },
  );
}
