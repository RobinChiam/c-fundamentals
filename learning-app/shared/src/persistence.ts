import { z } from "zod";

export const persistenceStatusSchema = z.object({
  available: z.boolean(),
  database: z.literal("sqlite"),
  reason: z.literal("initialization_failed").nullable(),
});

export const lessonProgressStatusSchema = z.enum(["in_progress", "completed"]);

export const lessonProgressSchema = z.object({
  lessonId: z.string(),
  status: lessonProgressStatusSchema,
  lastVisitedAt: z.string(),
  completedAt: z.string().nullable(),
  updatedAt: z.string(),
});

export const learningStateSchema = z.object({
  lastLessonId: z.string().nullable(),
  lessons: z.array(lessonProgressSchema),
});

export const savedDraftSchema = z.object({
  lessonId: z.string(),
  fileId: z.string(),
  content: z.string(),
  updatedAt: z.string(),
  stale: z.boolean(),
});

export const draftListResponseSchema = z.object({
  lessonId: z.string(),
  drafts: z.array(savedDraftSchema),
});

export const saveDraftRequestSchema = z.object({
  content: z.string(),
});

export const updateProgressRequestSchema = z.object({
  status: lessonProgressStatusSchema,
});

export type PersistenceStatus = z.infer<typeof persistenceStatusSchema>;
export type LessonProgressStatus = z.infer<typeof lessonProgressStatusSchema>;
export type LessonProgress = z.infer<typeof lessonProgressSchema>;
export type LearningState = z.infer<typeof learningStateSchema>;
export type SavedDraft = z.infer<typeof savedDraftSchema>;
export type DraftListResponse = z.infer<typeof draftListResponseSchema>;
export type SaveDraftRequest = z.infer<typeof saveDraftRequestSchema>;
export type UpdateProgressRequest = z.infer<typeof updateProgressRequestSchema>;
