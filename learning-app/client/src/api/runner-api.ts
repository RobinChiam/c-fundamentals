import type { RunRequest, RunResponse, RunnerStatus } from "@learning-app/shared";
import {
  runResponseSchema,
  runnerStatusSchema,
} from "@learning-app/shared";

export class RunnerApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "RunnerApiError";
    this.status = status;
  }
}

export class RunnerApiValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RunnerApiValidationError";
  }
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new RunnerApiError("Response was not valid JSON", response.status);
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
    throw new RunnerApiValidationError("API response failed schema validation");
  }
  return result.data;
}

export async function getRunnerStatus(): Promise<RunnerStatus> {
  let response: Response;

  try {
    response = await fetch("/api/runner/status");
  } catch {
    throw new RunnerApiError("Network request failed");
  }

  if (!response.ok) {
    throw new RunnerApiError(
      `Request failed with status ${response.status}`,
      response.status,
    );
  }

  const body = await parseJsonResponse(response);
  return validateResponse(runnerStatusSchema, body);
}

export async function runLesson(
  lessonId: string,
  files: RunRequest["files"],
  stdin: string,
): Promise<RunResponse> {
  let response: Response;

  try {
    response = await fetch(
      `/api/lessons/${encodeURIComponent(lessonId)}/run`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files, stdin }),
      },
    );
  } catch {
    throw new RunnerApiError("Network request failed");
  }

  if (!response.ok) {
    throw new RunnerApiError(
      `Request failed with status ${response.status}`,
      response.status,
    );
  }

  const body = await parseJsonResponse(response);
  return validateResponse(runResponseSchema, body);
}

export { buildCompileRequestFromWorkspace } from "./compiler-api.js";
