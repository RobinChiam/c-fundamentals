import {
  curriculumResponseSchema,
  lessonDetailSchema,
  lessonFileContentSchema,
  type CurriculumResponse,
  type LessonDetail,
  type LessonFileContent,
} from "@learning-app/shared";

export class CurriculumApiNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CurriculumApiNotFoundError";
  }
}

export class CurriculumApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "CurriculumApiError";
    this.status = status;
  }
}

export class CurriculumApiValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CurriculumApiValidationError";
  }
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new CurriculumApiError("Response was not valid JSON", response.status);
  }
}

function validateResponse<T>(
  schema: { safeParse: (data: unknown) => { success: true; data: T } | { success: false } },
  data: unknown,
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new CurriculumApiValidationError("API response failed schema validation");
  }
  return result.data;
}

async function requestCurriculumApi<T>(
  url: string,
  schema: {
    safeParse: (
      data: unknown,
    ) => { success: true; data: T } | { success: false };
  },
  notFoundMessage: string,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url);
  } catch {
    throw new CurriculumApiError("Network request failed");
  }

  if (response.status === 404) {
    throw new CurriculumApiNotFoundError(notFoundMessage);
  }

  if (!response.ok) {
    throw new CurriculumApiError(
      `Request failed with status ${response.status}`,
      response.status,
    );
  }

  const body = await parseJsonResponse(response);
  return validateResponse(schema, body);
}

export async function listCurriculum(): Promise<CurriculumResponse> {
  return requestCurriculumApi(
    "/api/curriculum",
    curriculumResponseSchema,
    "Curriculum not found",
  );
}

export async function getLesson(lessonId: string): Promise<LessonDetail> {
  return requestCurriculumApi(
    `/api/lessons/${encodeURIComponent(lessonId)}`,
    lessonDetailSchema,
    "Lesson not found",
  );
}

export async function getLessonFile(
  lessonId: string,
  fileId: string,
): Promise<LessonFileContent> {
  return requestCurriculumApi(
    `/api/lessons/${encodeURIComponent(lessonId)}/files/${encodeURIComponent(fileId)}`,
    lessonFileContentSchema,
    "Lesson file not found",
  );
}
