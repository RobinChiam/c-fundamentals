import { z } from "zod";

export const compilerStatusSchema = z.object({
  available: z.boolean(),
  compiler: z.literal("gcc"),
  version: z.string().nullable(),
});

export const compileRequestFileSchema = z.object({
  id: z.string(),
  content: z.string(),
});

export const compileRequestSchema = z.object({
  files: z.array(compileRequestFileSchema),
});

export const diagnosticSeveritySchema = z.enum(["error", "warning", "note"]);

export const compilerDiagnosticSchema = z.object({
  severity: diagnosticSeveritySchema,
  fileId: z.string().optional(),
  fileName: z.string().optional(),
  line: z.number().int().positive().optional(),
  column: z.number().int().positive().optional(),
  message: z.string(),
  option: z.string().optional(),
});

export const compileOutcomeSchema = z.enum(["success", "failed", "timeout"]);

export const compileResponseSchema = z.object({
  outcome: compileOutcomeSchema,
  exitCode: z.number().int().nullable(),
  stdout: z.string(),
  stderr: z.string(),
  stdoutTruncated: z.boolean(),
  stderrTruncated: z.boolean(),
  diagnostics: z.array(compilerDiagnosticSchema),
});

export type CompilerStatus = z.infer<typeof compilerStatusSchema>;
export type CompileRequest = z.infer<typeof compileRequestSchema>;
export type CompileRequestFile = z.infer<typeof compileRequestFileSchema>;
export type DiagnosticSeverity = z.infer<typeof diagnosticSeveritySchema>;
export type CompilerDiagnostic = z.infer<typeof compilerDiagnosticSchema>;
export type CompileOutcome = z.infer<typeof compileOutcomeSchema>;
export type CompileResponse = z.infer<typeof compileResponseSchema>;
