import type { FastifyInstance } from "fastify";
import {
  curriculumResponseSchema,
  lessonDetailSchema,
  lessonFileContentSchema,
} from "@learning-app/shared";
import {
  CurriculumIntegrityError,
  LessonFileNotFoundError,
  LessonNotFoundError,
  type CurriculumService,
} from "../curriculum/curriculum-service.js";

export async function registerCurriculumRoutes(
  app: FastifyInstance,
  curriculumService: CurriculumService,
): Promise<void> {
  app.get("/api/curriculum", async () => {
    const lessons = curriculumService.listLessons();
    return curriculumResponseSchema.parse({ lessons });
  });

  app.get<{ Params: { lessonId: string } }>(
    "/api/lessons/:lessonId",
    async (request, reply) => {
      try {
        const lesson = curriculumService.getLessonDetail(request.params.lessonId);
        return lessonDetailSchema.parse(lesson);
      } catch (error) {
        if (error instanceof LessonNotFoundError) {
          return reply.status(404).send({ error: "Lesson not found" });
        }
        throw error;
      }
    },
  );

  app.get<{ Params: { lessonId: string; fileId: string } }>(
    "/api/lessons/:lessonId/files/:fileId",
    async (request, reply) => {
      try {
        const fileContent = await curriculumService.getLessonFileContent(
          request.params.lessonId,
          request.params.fileId,
        );
        return lessonFileContentSchema.parse(fileContent);
      } catch (error) {
        if (
          error instanceof LessonNotFoundError ||
          error instanceof LessonFileNotFoundError
        ) {
          return reply.status(404).send({ error: "Lesson file not found" });
        }
        if (error instanceof CurriculumIntegrityError) {
          request.log.error(error);
          return reply.status(500).send({ error: "Curriculum integrity error" });
        }
        throw error;
      }
    },
  );
}
