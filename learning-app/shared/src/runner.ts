import { z } from "zod";
import { compileResponseSchema } from "./compiler.js";

export const runnerUnavailableReasonSchema = z.enum([
  "runtime_missing",
  "daemon_unavailable",
  "image_missing",
  "unsupported",
]);

export const runnerStatusSchema = z.object({
  available: z.boolean(),
  runtime: z.literal("docker"),
  image: z.string(),
  reason: runnerUnavailableReasonSchema.nullable(),
});

export const runRequestFileSchema = z.object({
  id: z.string(),
  content: z.string(),
});

export const runRequestSchema = z.object({
  files: z.array(runRequestFileSchema),
  stdin: z.string(),
});

export const executionOutcomeSchema = z.enum([
  "success",
  "runtime_error",
  "timeout",
  "output_limit",
]);

export const executionResultSchema = z.object({
  outcome: executionOutcomeSchema,
  exitCode: z.number().int().nullable(),
  stdout: z.string(),
  stderr: z.string(),
  stdoutTruncated: z.boolean(),
  stderrTruncated: z.boolean(),
  durationMs: z.number().int().nonnegative(),
});

export const runResponseSchema = z.object({
  compile: compileResponseSchema,
  execution: executionResultSchema.nullable(),
});

export type RunnerUnavailableReason = z.infer<typeof runnerUnavailableReasonSchema>;
export type RunnerStatus = z.infer<typeof runnerStatusSchema>;
export type RunRequest = z.infer<typeof runRequestSchema>;
export type RunRequestFile = z.infer<typeof runRequestFileSchema>;
export type ExecutionOutcome = z.infer<typeof executionOutcomeSchema>;
export type ExecutionResult = z.infer<typeof executionResultSchema>;
export type RunResponse = z.infer<typeof runResponseSchema>;
