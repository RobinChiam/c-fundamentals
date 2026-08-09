import { z } from "zod";

export const lessonDifficultySchema = z.enum([
  "Beginner (starter)",
  "Beginner",
  "Beginner–Intermediate",
  "Intermediate",
]);

export const lessonFileRoleSchema = z.enum([
  "readme",
  "primary",
  "support",
  "header",
  "solution",
]);

export const lessonFileLanguageSchema = z.enum(["markdown", "c"]);

export const lessonFileDescriptorSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: lessonFileRoleSchema,
  language: lessonFileLanguageSchema,
});

export const lessonSummarySchema = z.object({
  id: z.string(),
  lessonNumber: z.number().int().min(0),
  sequence: z.number().int().min(0),
  title: z.string(),
  difficulty: lessonDifficultySchema,
});

export const curriculumResponseSchema = z.object({
  lessons: z.array(lessonSummarySchema),
});

export const lessonDetailSchema = lessonSummarySchema.extend({
  files: z.array(lessonFileDescriptorSchema),
});

export const lessonFileContentSchema = z.object({
  lessonId: z.string(),
  file: lessonFileDescriptorSchema,
  content: z.string(),
});

export type LessonDifficulty = z.infer<typeof lessonDifficultySchema>;
export type LessonFileRole = z.infer<typeof lessonFileRoleSchema>;
export type LessonFileLanguage = z.infer<typeof lessonFileLanguageSchema>;
export type LessonFileDescriptor = z.infer<typeof lessonFileDescriptorSchema>;
export type LessonSummary = z.infer<typeof lessonSummarySchema>;
export type CurriculumResponse = z.infer<typeof curriculumResponseSchema>;
export type LessonDetail = z.infer<typeof lessonDetailSchema>;
export type LessonFileContent = z.infer<typeof lessonFileContentSchema>;

export type LessonId = LessonSummary["id"];
export type LessonFileId = LessonFileDescriptor["id"];
