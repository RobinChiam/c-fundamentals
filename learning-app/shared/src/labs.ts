import { z } from "zod";

export const labStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "completed",
]);

export const labTestVisibilitySchema = z.enum(["public", "hidden"]);

export const labAttemptOutcomeSchema = z.enum([
  "passed",
  "failed",
  "compile_error",
  "runtime_error",
  "timeout",
  "output_limit",
]);

export const labSummarySchema = z.object({
  id: z.string(),
  lessonId: z.string(),
  exerciseNumber: z.number().int().positive(),
  title: z.string(),
  revision: z.number().int().positive(),
  status: labStatusSchema,
});

export const labStarterFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  language: z.literal("c"),
  content: z.string(),
});

export const labPublicTestMetadataSchema = z.object({
  id: z.string(),
  title: z.string(),
  visibility: z.literal("public"),
});

export const labHiddenTestMetadataSchema = z.object({
  id: z.string(),
  title: z.string(),
  visibility: z.literal("hidden"),
});

export const labTestMetadataSchema = z.discriminatedUnion("visibility", [
  labPublicTestMetadataSchema,
  labHiddenTestMetadataSchema,
]);

export const labRevealedHintSchema = z.object({
  index: z.number().int().min(0),
  content: z.string(),
});

export const labProgressSchema = z.object({
  hintsRevealed: z.number().int().min(0),
  solutionRevealed: z.boolean(),
  completedAt: z.string().nullable(),
  lastAttemptAt: z.string().nullable(),
});

export const labDetailSchema = z.object({
  id: z.string(),
  lessonId: z.string(),
  exerciseNumber: z.number().int().positive(),
  title: z.string(),
  revision: z.number().int().positive(),
  prompt: z.string(),
  concepts: z.array(z.string()),
  starterFiles: z.array(labStarterFileSchema),
  publicTests: z.array(labPublicTestMetadataSchema),
  hiddenTests: z.array(labHiddenTestMetadataSchema),
  revealedHints: z.array(labRevealedHintSchema),
  solutionRevealed: z.boolean(),
  status: labStatusSchema,
  progress: labProgressSchema,
});

export const labDraftSchema = z.object({
  labId: z.string(),
  fileId: z.string(),
  content: z.string(),
  baseRevision: z.number().int().positive(),
  updatedAt: z.string(),
  stale: z.boolean(),
});

export const labDraftListResponseSchema = z.object({
  labId: z.string(),
  revision: z.number().int().positive(),
  drafts: z.array(labDraftSchema),
});

export const saveLabDraftRequestSchema = z.object({
  content: z.string(),
});

export const labEvaluationRequestSchema = z.object({
  files: z.array(
    z.object({
      id: z.string(),
      content: z.string(),
    }),
  ),
});

export const labTestResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  visibility: labTestVisibilitySchema,
  passed: z.boolean(),
});

export const labEvaluationResponseSchema = z.object({
  outcome: labAttemptOutcomeSchema,
  passedTests: z.number().int().min(0),
  totalTests: z.number().int().min(0),
  testResults: z.array(labTestResultSchema),
  compileDiagnostics: z.array(
    z.object({
      severity: z.enum(["error", "warning", "note"]),
      fileName: z.string(),
      fileId: z.string().optional(),
      line: z.number().int(),
      column: z.number().int(),
      message: z.string(),
      option: z.string().optional(),
    }),
  ),
  attemptPersisted: z.boolean(),
});

export const labAttemptSummarySchema = z.object({
  id: z.number().int(),
  outcome: labAttemptOutcomeSchema,
  passedTests: z.number().int().min(0),
  totalTests: z.number().int().min(0),
  createdAt: z.string(),
});

export const labAttemptListResponseSchema = z.object({
  labId: z.string(),
  attempts: z.array(labAttemptSummarySchema),
});

export const hintRevealResponseSchema = z.object({
  index: z.number().int().min(0),
  content: z.string(),
  hintsRevealed: z.number().int().min(0),
});

export const solutionRevealResponseSchema = z.object({
  fileName: z.string(),
  content: z.string(),
  solutionRevealed: z.literal(true),
});

export type LabStatus = z.infer<typeof labStatusSchema>;
export type LabTestVisibility = z.infer<typeof labTestVisibilitySchema>;
export type LabAttemptOutcome = z.infer<typeof labAttemptOutcomeSchema>;
export type LabSummary = z.infer<typeof labSummarySchema>;
export type LabStarterFile = z.infer<typeof labStarterFileSchema>;
export type LabPublicTestMetadata = z.infer<typeof labPublicTestMetadataSchema>;
export type LabHiddenTestMetadata = z.infer<typeof labHiddenTestMetadataSchema>;
export type LabTestMetadata = z.infer<typeof labTestMetadataSchema>;
export type LabRevealedHint = z.infer<typeof labRevealedHintSchema>;
export type LabProgress = z.infer<typeof labProgressSchema>;
export type LabDetail = z.infer<typeof labDetailSchema>;
export type LabDraft = z.infer<typeof labDraftSchema>;
export type LabDraftListResponse = z.infer<typeof labDraftListResponseSchema>;
export type SaveLabDraftRequest = z.infer<typeof saveLabDraftRequestSchema>;
export type LabEvaluationRequest = z.infer<typeof labEvaluationRequestSchema>;
export type LabTestResult = z.infer<typeof labTestResultSchema>;
export type LabEvaluationResponse = z.infer<typeof labEvaluationResponseSchema>;
export type LabAttemptSummary = z.infer<typeof labAttemptSummarySchema>;
export type LabAttemptListResponse = z.infer<typeof labAttemptListResponseSchema>;
export type HintRevealResponse = z.infer<typeof hintRevealResponseSchema>;
export type SolutionRevealResponse = z.infer<typeof solutionRevealResponseSchema>;
