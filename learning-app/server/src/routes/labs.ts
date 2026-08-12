import type { FastifyInstance } from "fastify";
import {
  hintRevealResponseSchema,
  labAttemptListResponseSchema,
  labDetailSchema,
  labDraftListResponseSchema,
  labEvaluationRequestSchema,
  labEvaluationResponseSchema,
  labSummarySchema,
  saveLabDraftRequestSchema,
  labDraftSchema,
  solutionRevealResponseSchema,
} from "@learning-app/shared";
import { LessonNotFoundError } from "../curriculum/curriculum-service.js";
import { PersistenceUnavailableError } from "../persistence/persistence-errors.js";
import {
  LabDraftPayloadTooLargeError,
  LabHintRevealError,
  LabIntegrityError,
  LabNotFoundError,
  LabStarterFileNotFoundError,
} from "../labs/lab-errors.js";
import type { LabService } from "../labs/lab-service.js";
import { RunnerUnavailableError } from "../runner/runner-errors.js";
import type { ExecutionGate } from "../concurrency/execution-gate.js";
import type { ShutdownManager } from "../shutdown/graceful-shutdown.js";

export interface LabRouteOptions {
  sandboxGate?: ExecutionGate;
  shutdownManager?: ShutdownManager;
}

export async function registerLabRoutes(
  app: FastifyInstance,
  labService: LabService,
  options: LabRouteOptions = {},
): Promise<void> {
  app.get<{ Params: { lessonId: string } }>(
    "/api/lessons/:lessonId/labs",
    async (request, reply) => {
      try {
        const labs = labService.listLabsForLesson(request.params.lessonId);
        return { labs: labs.map((lab) => labSummarySchema.parse(lab)) };
      } catch (error) {
        if (error instanceof LessonNotFoundError) {
          return reply.status(404).send({ error: "Lesson not found" });
        }
        throw error;
      }
    },
  );

  app.get<{ Params: { labId: string } }>(
    "/api/labs/:labId",
    async (request, reply) => {
      try {
        const detail = labService.getLabDetail(request.params.labId);
        return labDetailSchema.parse(detail);
      } catch (error) {
        if (error instanceof LabNotFoundError) {
          return reply.status(404).send({ error: "Lab not found" });
        }
        throw error;
      }
    },
  );

  app.get<{ Params: { labId: string } }>(
    "/api/labs/:labId/drafts",
    async (request, reply) => {
      try {
        const drafts = labService.listDrafts(request.params.labId);
        return labDraftListResponseSchema.parse(drafts);
      } catch (error) {
        if (error instanceof LabNotFoundError) {
          return reply.status(404).send({ error: "Lab not found" });
        }
        if (error instanceof PersistenceUnavailableError) {
          return reply.status(503).send({ error: "Persistence unavailable" });
        }
        throw error;
      }
    },
  );

  app.put<{ Params: { labId: string; fileId: string } }>(
    "/api/labs/:labId/drafts/:fileId",
    async (request, reply) => {
      const parsedBody = saveLabDraftRequestSchema.safeParse(request.body);
      if (!parsedBody.success) {
        return reply.status(400).send({ error: "Invalid draft request" });
      }

      try {
        const saved = await labService.saveDraft(
          request.params.labId,
          request.params.fileId,
          parsedBody.data.content,
        );
        return labDraftSchema.parse(saved);
      } catch (error) {
        if (error instanceof LabNotFoundError) {
          return reply.status(404).send({ error: "Lab not found" });
        }
        if (error instanceof LabStarterFileNotFoundError) {
          return reply.status(404).send({ error: "Lab starter file not found" });
        }
        if (error instanceof LabDraftPayloadTooLargeError) {
          return reply.status(400).send({ error: error.message });
        }
        if (error instanceof PersistenceUnavailableError) {
          return reply.status(503).send({ error: "Persistence unavailable" });
        }
        throw error;
      }
    },
  );

  app.delete<{ Params: { labId: string; fileId: string } }>(
    "/api/labs/:labId/drafts/:fileId",
    async (request, reply) => {
      try {
        labService.deleteDraft(request.params.labId, request.params.fileId);
        return reply.status(204).send();
      } catch (error) {
        if (error instanceof LabNotFoundError) {
          return reply.status(404).send({ error: "Lab not found" });
        }
        if (error instanceof PersistenceUnavailableError) {
          return reply.status(503).send({ error: "Persistence unavailable" });
        }
        throw error;
      }
    },
  );

  app.delete<{ Params: { labId: string } }>(
    "/api/labs/:labId/drafts",
    async (request, reply) => {
      try {
        labService.deleteAllDrafts(request.params.labId);
        return reply.status(204).send();
      } catch (error) {
        if (error instanceof LabNotFoundError) {
          return reply.status(404).send({ error: "Lab not found" });
        }
        if (error instanceof PersistenceUnavailableError) {
          return reply.status(503).send({ error: "Persistence unavailable" });
        }
        throw error;
      }
    },
  );

  app.post<{ Params: { labId: string } }>(
    "/api/labs/:labId/evaluate",
    async (request, reply) => {
      if (options.shutdownManager?.isShuttingDown()) {
        return reply.status(503).send({ error: "Server is shutting down" });
      }

      const parsedBody = labEvaluationRequestSchema.safeParse(request.body);
      if (!parsedBody.success) {
        return reply.status(400).send({ error: "Invalid evaluation request" });
      }

      const gate = options.sandboxGate;
      if (gate && !gate.tryAcquire()) {
        return reply.status(429).send({
          error: "Sandbox is busy. Try again shortly.",
        });
      }

      try {
        const result = await labService.evaluate(
          request.params.labId,
          parsedBody.data,
        );
        return labEvaluationResponseSchema.parse(result);
      } catch (error) {
        if (error instanceof LabNotFoundError) {
          return reply.status(404).send({ error: "Lab not found" });
        }
        if (error instanceof LabStarterFileNotFoundError) {
          return reply.status(400).send({ error: "Missing submission file" });
        }
        if (error instanceof RunnerUnavailableError) {
          return reply.status(503).send({ error: "Runner unavailable" });
        }
        if (error instanceof LabIntegrityError) {
          request.log.error(error);
          return reply.status(500).send({ error: "Lab integrity error" });
        }
        throw error;
      } finally {
        gate?.release();
      }
    },
  );

  app.post<{ Params: { labId: string; hintIndex: string } }>(
    "/api/labs/:labId/hints/:hintIndex/reveal",
    async (request, reply) => {
      const hintIndex = Number.parseInt(request.params.hintIndex, 10);
      if (Number.isNaN(hintIndex) || hintIndex < 0) {
        return reply.status(400).send({ error: "Invalid hint index" });
      }

      try {
        const result = labService.revealHint(request.params.labId, hintIndex);
        return hintRevealResponseSchema.parse(result);
      } catch (error) {
        if (error instanceof LabNotFoundError) {
          return reply.status(404).send({ error: "Lab not found" });
        }
        if (error instanceof LabHintRevealError) {
          return reply.status(400).send({ error: error.message });
        }
        if (error instanceof PersistenceUnavailableError) {
          return reply.status(503).send({ error: "Persistence unavailable" });
        }
        throw error;
      }
    },
  );

  app.post<{ Params: { labId: string } }>(
    "/api/labs/:labId/solution/reveal",
    async (request, reply) => {
      try {
        const result = await labService.revealSolution(request.params.labId);
        return solutionRevealResponseSchema.parse(result);
      } catch (error) {
        if (error instanceof LabNotFoundError) {
          return reply.status(404).send({ error: "Lab not found" });
        }
        if (error instanceof PersistenceUnavailableError) {
          return reply.status(503).send({ error: "Persistence unavailable" });
        }
        throw error;
      }
    },
  );

  app.get<{ Params: { labId: string } }>(
    "/api/labs/:labId/attempts",
    async (request, reply) => {
      try {
        const attempts = labService.listAttempts(request.params.labId);
        return labAttemptListResponseSchema.parse(attempts);
      } catch (error) {
        if (error instanceof LabNotFoundError) {
          return reply.status(404).send({ error: "Lab not found" });
        }
        throw error;
      }
    },
  );
}
