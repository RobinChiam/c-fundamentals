import {
  lessonArchitectureResponseSchema,
  type LessonArchitectureResponse,
} from "@learning-app/shared";
import {
  CurriculumApiError,
  CurriculumApiNotFoundError,
  CurriculumApiValidationError,
} from "./curriculum-api";

export class ArchitectureApiNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArchitectureApiNotFoundError";
  }
}

export class ArchitectureApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ArchitectureApiError";
    this.status = status;
  }
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new ArchitectureApiError(
      "Response was not valid JSON",
      response.status,
    );
  }
}

export async function getLessonArchitecture(
  lessonId: string,
): Promise<LessonArchitectureResponse> {
  let response: Response;

  try {
    response = await fetch(
      `/api/lessons/${encodeURIComponent(lessonId)}/architecture`,
    );
  } catch {
    throw new ArchitectureApiError("Network request failed");
  }

  if (response.status === 404) {
    throw new ArchitectureApiNotFoundError("Architecture not found");
  }

  if (!response.ok) {
    throw new ArchitectureApiError(
      `Request failed with status ${response.status}`,
      response.status,
    );
  }

  const body = await parseJsonResponse(response);
  const result = lessonArchitectureResponseSchema.safeParse(body);
  if (!result.success) {
    throw new CurriculumApiValidationError(
      "Architecture API response failed schema validation",
    );
  }

  return result.data;
}

export {
  CurriculumApiError,
  CurriculumApiNotFoundError,
  CurriculumApiValidationError,
};
