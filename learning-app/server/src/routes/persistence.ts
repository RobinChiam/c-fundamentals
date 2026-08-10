import type { FastifyInstance } from "fastify";
import {
  draftListResponseSchema,
  learningStateSchema,
  lessonProgressSchema,
  persistenceStatusSchema,
  saveDraftRequestSchema,
  savedDraftSchema,
  updateProgressRequestSchema,
} from "@learning-app/shared";
import {
  LessonFileNotFoundError,
  LessonNotFoundError,
} from "../curriculum/curriculum-service.js";
import {
  DraftPayloadTooLargeError,
  NonEditableFileError,
  PersistenceUnavailableError,
} from "../persistence/persistence-errors.js";
import type { PersistenceService } from "../persistence/persistence-service.js";

function isPersistenceUnavailable(error: unknown): boolean {
  return error instanceof PersistenceUnavailableError;
}

export async function registerPersistenceRoutes(
  app: FastifyInstance,
  persistenceService: PersistenceService,
): Promise<void> {
  app.get("/api/persistence/status", async () => {
    return persistenceStatusSchema.parse(persistenceService.getStatus());
  });

  app.get("/api/learning-state", async (_request, reply) => {
    try {
      const state = persistenceService.getLearningState();
      return learningStateSchema.parse(state);
    } catch (error) {
      if (isPersistenceUnavailable(error)) {
        return reply.status(503).send({ error: "Persistence unavailable" });
      }
      throw error;
    }
  });

  app.post<{ Params: { lessonId: string } }>(
    "/api/lessons/:lessonId/visit",
    async (request, reply) => {
      try {
        const progress = persistenceService.visitLesson(request.params.lessonId);
        return lessonProgressSchema.parse(progress);
      } catch (error) {
        if (error instanceof LessonNotFoundError) {
          return reply.status(404).send({ error: "Lesson not found" });
        }
        if (isPersistenceUnavailable(error)) {
          return reply.status(503).send({ error: "Persistence unavailable" });
        }
        throw error;
      }
    },
  );

  app.put<{ Params: { lessonId: string } }>(
    "/api/lessons/:lessonId/progress",
    async (request, reply) => {
      const parsedBody = updateProgressRequestSchema.safeParse(request.body);
      if (!parsedBody.success) {
        return reply.status(400).send({ error: "Invalid progress request" });
      }

      try {
        const progress = persistenceService.updateProgress(
          request.params.lessonId,
          parsedBody.data.status,
        );
        return lessonProgressSchema.parse(progress);
      } catch (error) {
        if (error instanceof LessonNotFoundError) {
          return reply.status(404).send({ error: "Lesson not found" });
        }
        if (isPersistenceUnavailable(error)) {
          return reply.status(503).send({ error: "Persistence unavailable" });
        }
        throw error;
      }
    },
  );

  app.get<{ Params: { lessonId: string } }>(
    "/api/lessons/:lessonId/drafts",
    async (request, reply) => {
      try {
        const drafts = await persistenceService.listDrafts(
          request.params.lessonId,
        );
        return draftListResponseSchema.parse(drafts);
      } catch (error) {
        if (error instanceof LessonNotFoundError) {
          return reply.status(404).send({ error: "Lesson not found" });
        }
        if (isPersistenceUnavailable(error)) {
          return reply.status(503).send({ error: "Persistence unavailable" });
        }
        throw error;
      }
    },
  );

  app.put<{ Params: { lessonId: string; fileId: string } }>(
    "/api/lessons/:lessonId/drafts/:fileId",
    async (request, reply) => {
      const parsedBody = saveDraftRequestSchema.safeParse(request.body);
      if (!parsedBody.success) {
        return reply.status(400).send({ error: "Invalid draft request" });
      }

      try {
        const saved = await persistenceService.saveDraft(
          request.params.lessonId,
          request.params.fileId,
          parsedBody.data.content,
        );
        return savedDraftSchema.parse(saved);
      } catch (error) {
        if (error instanceof LessonNotFoundError) {
          return reply.status(404).send({ error: "Lesson not found" });
        }
        if (error instanceof LessonFileNotFoundError) {
          return reply.status(404).send({ error: "Lesson file not found" });
        }
        if (error instanceof NonEditableFileError) {
          return reply.status(400).send({ error: error.message });
        }
        if (error instanceof DraftPayloadTooLargeError) {
          return reply.status(400).send({ error: error.message });
        }
        if (isPersistenceUnavailable(error)) {
          return reply.status(503).send({ error: "Persistence unavailable" });
        }
        throw error;
      }
    },
  );

  app.delete<{ Params: { lessonId: string; fileId: string } }>(
    "/api/lessons/:lessonId/drafts/:fileId",
    async (request, reply) => {
      try {
        persistenceService.deleteDraft(
          request.params.lessonId,
          request.params.fileId,
        );
        return reply.status(204).send();
      } catch (error) {
        if (isPersistenceUnavailable(error)) {
          return reply.status(503).send({ error: "Persistence unavailable" });
        }
        throw error;
      }
    },
  );

  app.delete<{ Params: { lessonId: string } }>(
    "/api/lessons/:lessonId/drafts",
    async (request, reply) => {
      try {
        persistenceService.deleteAllDrafts(request.params.lessonId);
        return reply.status(204).send();
      } catch (error) {
        if (isPersistenceUnavailable(error)) {
          return reply.status(503).send({ error: "Persistence unavailable" });
        }
        throw error;
      }
    },
  );
}
