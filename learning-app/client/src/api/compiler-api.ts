import type { CompileRequest, CompileResponse, CompilerStatus } from "@learning-app/shared";
import {
  compileResponseSchema,
  compilerStatusSchema,
} from "@learning-app/shared";

export class CompilerApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "CompilerApiError";
    this.status = status;
  }
}

export class CompilerApiValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CompilerApiValidationError";
  }
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new CompilerApiError("Response was not valid JSON", response.status);
  }
}

function validateResponse<T>(
  schema: {
    safeParse: (data: unknown) => { success: true; data: T } | { success: false };
  },
  data: unknown,
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new CompilerApiValidationError("API response failed schema validation");
  }
  return result.data;
}

export async function getCompilerStatus(): Promise<CompilerStatus> {
  let response: Response;

  try {
    response = await fetch("/api/compiler/status");
  } catch {
    throw new CompilerApiError("Network request failed");
  }

  if (!response.ok) {
    throw new CompilerApiError(
      `Request failed with status ${response.status}`,
      response.status,
    );
  }

  const body = await parseJsonResponse(response);
  return validateResponse(compilerStatusSchema, body);
}

export async function compileLesson(
  lessonId: string,
  request: CompileRequest,
): Promise<CompileResponse> {
  let response: Response;

  try {
    response = await fetch(
      `/api/lessons/${encodeURIComponent(lessonId)}/compile`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      },
    );
  } catch {
    throw new CompilerApiError("Network request failed");
  }

  if (!response.ok) {
    throw new CompilerApiError(
      `Request failed with status ${response.status}`,
      response.status,
    );
  }

  const body = await parseJsonResponse(response);
  return validateResponse(compileResponseSchema, body);
}

export function buildCompileRequestFromWorkspace(
  files: Array<{ id: string; draftContent: string; role: string }>,
): CompileRequest {
  return {
    files: files
      .filter((file) => file.role === "primary" || file.role === "support" || file.role === "header")
      .map((file) => ({
        id: file.id,
        content: file.draftContent,
      })),
  };
}
