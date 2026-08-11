import { z } from "zod";
import { lessonFileRoleSchema } from "./curriculum.js";

export const architectureFileKindSchema = z.enum([
  "source",
  "header",
  "resource",
]);

export const architectureFileSchema = z.object({
  fileId: z.string(),
  name: z.string(),
  role: lessonFileRoleSchema,
  kind: architectureFileKindSchema,
  responsibility: z.string().optional(),
});

export const includeEdgeSchema = z.object({
  fromFileId: z.string(),
  toFileId: z.string(),
  includeName: z.string(),
});

export const includeGuardSchema = z.object({
  fileId: z.string(),
  macro: z.string(),
});

export const moduleAnnotationSchema = z.object({
  id: z.string(),
  label: z.string(),
  fileIds: z.array(z.string()),
  responsibility: z.string(),
  publicConcepts: z.array(z.string()),
});

export const ownershipRelationSchema = z.object({
  ownerModuleId: z.string(),
  resourceId: z.string(),
  label: z.string(),
  description: z.string(),
});

export const architectureResourceSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  format: z.string().optional(),
});

export const translationUnitSchema = z.object({
  sourceFileId: z.string(),
  sourceFileName: z.string(),
  includedHeaderFileIds: z.array(z.string()),
  objectFileLabel: z.string(),
});

export const architectureBuildSpecSchema = z.object({
  sourceFileIds: z.array(z.string()),
  translationUnits: z.array(translationUnitSchema),
  linkFlags: z.array(z.string()),
  outputLabel: z.string(),
});

export const buildMistakeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.enum(["compile", "link", "preprocessor"]),
});

export const workflowStepSchema = z.object({
  id: z.string(),
  label: z.string(),
  moduleId: z.string().optional(),
  fileId: z.string().optional(),
  resourceId: z.string().optional(),
  symbol: z.string().optional(),
  narration: z.string(),
});

export const architectureWorkflowSchema = z.object({
  id: z.string(),
  title: z.string(),
  steps: z.array(workflowStepSchema),
  moduleCollaborationNote: z.string().optional(),
});

export const buildPipelineStageSchema = z.object({
  id: z.string(),
  label: z.string(),
  narration: z.string(),
  highlights: z.array(z.string()),
});

export const lessonArchitectureResponseSchema = z.object({
  lessonId: z.string(),
  lessonTitle: z.string(),
  isCapstone: z.boolean(),
  files: z.array(architectureFileSchema),
  includes: z.array(includeEdgeSchema),
  includeGuards: z.array(includeGuardSchema),
  modules: z.array(moduleAnnotationSchema),
  ownership: z.array(ownershipRelationSchema),
  resources: z.array(architectureResourceSchema),
  build: architectureBuildSpecSchema,
  buildPipelineStages: z.array(buildPipelineStageSchema),
  buildMistakes: z.array(buildMistakeSchema).optional(),
  workflows: z.array(architectureWorkflowSchema),
  solutionOmittedNote: z.string(),
});

export type ArchitectureFileKind = z.infer<typeof architectureFileKindSchema>;
export type ArchitectureFile = z.infer<typeof architectureFileSchema>;
export type IncludeEdge = z.infer<typeof includeEdgeSchema>;
export type IncludeGuard = z.infer<typeof includeGuardSchema>;
export type ModuleAnnotation = z.infer<typeof moduleAnnotationSchema>;
export type OwnershipRelation = z.infer<typeof ownershipRelationSchema>;
export type ArchitectureResource = z.infer<typeof architectureResourceSchema>;
export type TranslationUnit = z.infer<typeof translationUnitSchema>;
export type ArchitectureBuildSpec = z.infer<typeof architectureBuildSpecSchema>;
export type BuildMistake = z.infer<typeof buildMistakeSchema>;
export type WorkflowStep = z.infer<typeof workflowStepSchema>;
export type ArchitectureWorkflow = z.infer<typeof architectureWorkflowSchema>;
export type BuildPipelineStage = z.infer<typeof buildPipelineStageSchema>;
export type LessonArchitectureResponse = z.infer<
  typeof lessonArchitectureResponseSchema
>;

export const SUPPORTED_ARCHITECTURE_LESSON_IDS = [
  "header-files-and-multiple-source-files",
  "intermediate-console-project",
] as const;

export type SupportedArchitectureLessonId =
  (typeof SUPPORTED_ARCHITECTURE_LESSON_IDS)[number];
