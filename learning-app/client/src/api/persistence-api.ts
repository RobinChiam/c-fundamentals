import {
  draftListResponseSchema,
  learningStateSchema,
  lessonProgressSchema,
  persistenceStatusSchema,
  saveDraftRequestSchema,
  savedDraftSchema,
  updateProgressRequestSchema,
  type DraftListResponse,
  type LearningState,
  type LessonProgress,
  type LessonProgressStatus,
  type PersistenceStatus,
  type SavedDraft,
} from "@learning-app/shared";

export class PersistenceApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "PersistenceApiError";
    this.status = status;
  }
}

export class PersistenceApiUnavailableError extends Error {
  constructor(message = "Persistence is unavailable") {
    super(message);
    this.name = "PersistenceApiUnavailableError";
  }
}

export class PersistenceApiValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PersistenceApiValidationError";
  }
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    throw new PersistenceApiError("Response was not valid JSON", response.status);
  }
}

function validateResponse<T>(
  schema: {
    safeParse: (
      data: unknown,
    ) => { success: true; data: T } | { success: false };
  },
  data: unknown,
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new PersistenceApiValidationError(
      "API response failed schema validation",
    );
  }
  return result.data;
}

async function requestPersistenceApi<T>(
  url: string,
  schema: {
    safeParse: (
      data: unknown,
    ) => { success: true; data: T } | { success: false };
  },
  init?: RequestInit,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, init);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new PersistenceApiError("Network request failed");
  }

  if (response.status === 503) {
    throw new PersistenceApiUnavailableError();
  }

  if (!response.ok) {
    throw new PersistenceApiError(
      `Request failed with status ${response.status}`,
      response.status,
    );
  }

  const body = await parseJsonResponse(response);
  if (body === null) {
    throw new PersistenceApiValidationError("Expected JSON response body");
  }

  return validateResponse(schema, body);
}

async function requestPersistenceVoid(
  url: string,
  init?: RequestInit,
): Promise<void> {
  let response: Response;

  try {
    response = await fetch(url, init);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new PersistenceApiError("Network request failed");
  }

  if (response.status === 503) {
    throw new PersistenceApiUnavailableError();
  }

  if (!response.ok && response.status !== 204) {
    throw new PersistenceApiError(
      `Request failed with status ${response.status}`,
      response.status,
    );
  }
}

export async function getPersistenceStatus(): Promise<PersistenceStatus> {
  return requestPersistenceApi("/api/persistence/status", persistenceStatusSchema);
}

export async function getLearningState(): Promise<LearningState> {
  return requestPersistenceApi("/api/learning-state", learningStateSchema);
}

export async function visitLesson(lessonId: string): Promise<LessonProgress> {
  return requestPersistenceApi(
    `/api/lessons/${encodeURIComponent(lessonId)}/visit`,
    lessonProgressSchema,
    { method: "POST" },
  );
}

export async function updateLessonProgress(
  lessonId: string,
  status: LessonProgressStatus,
): Promise<LessonProgress> {
  const body = updateProgressRequestSchema.parse({ status });
  return requestPersistenceApi(
    `/api/lessons/${encodeURIComponent(lessonId)}/progress`,
    lessonProgressSchema,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export async function getLessonDrafts(
  lessonId: string,
): Promise<DraftListResponse> {
  return requestPersistenceApi(
    `/api/lessons/${encodeURIComponent(lessonId)}/drafts`,
    draftListResponseSchema,
  );
}

export interface DraftPersistenceRequestOptions {
  signal?: AbortSignal;
}

export async function saveLessonDraft(
  lessonId: string,
  fileId: string,
  content: string,
  options: DraftPersistenceRequestOptions = {},
): Promise<SavedDraft> {
  const body = saveDraftRequestSchema.parse({ content });
  return requestPersistenceApi(
    `/api/lessons/${encodeURIComponent(lessonId)}/drafts/${encodeURIComponent(fileId)}`,
    savedDraftSchema,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: options.signal,
    },
  );
}

export async function deleteLessonDraft(
  lessonId: string,
  fileId: string,
  options: DraftPersistenceRequestOptions = {},
): Promise<void> {
  await requestPersistenceVoid(
    `/api/lessons/${encodeURIComponent(lessonId)}/drafts/${encodeURIComponent(fileId)}`,
    { method: "DELETE", signal: options.signal },
  );
}

export async function deleteLessonDrafts(lessonId: string): Promise<void> {
  await requestPersistenceVoid(
    `/api/lessons/${encodeURIComponent(lessonId)}/drafts`,
    { method: "DELETE" },
  );
}
