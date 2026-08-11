import type {
  HintRevealResponse,
  LabAttemptListResponse,
  LabDetail,
  LabDraft,
  LabDraftListResponse,
  LabEvaluationRequest,
  LabEvaluationResponse,
  LabSummary,
  SolutionRevealResponse,
} from "@learning-app/shared";

const API_BASE = "/api";

export class LabsApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LabsApiError";
  }
}

export class LabsApiNotFoundError extends LabsApiError {
  constructor(message: string) {
    super(message);
    this.name = "LabsApiNotFoundError";
  }
}

export class LabsApiUnavailableError extends LabsApiError {
  constructor(message: string) {
    super(message);
    this.name = "LabsApiUnavailableError";
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  return JSON.parse(text) as T;
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (response.status === 404) {
    throw new LabsApiNotFoundError("Resource not found");
  }
  if (response.status === 503) {
    const body = await parseJson<{ error?: string }>(response);
    throw new LabsApiUnavailableError(body.error ?? "Service unavailable");
  }
  if (!response.ok) {
    const body = await parseJson<{ error?: string }>(response);
    throw new LabsApiError(body.error ?? `Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return parseJson<T>(response);
}

export async function listLessonLabs(lessonId: string): Promise<LabSummary[]> {
  const body = await request<{ labs: LabSummary[] }>(
    `/lessons/${lessonId}/labs`,
  );
  return body.labs;
}

export async function getLab(labId: string): Promise<LabDetail> {
  return request<LabDetail>(`/labs/${labId}`);
}

export async function listLabDrafts(labId: string): Promise<LabDraftListResponse> {
  return request<LabDraftListResponse>(`/labs/${labId}/drafts`);
}

export async function saveLabDraft(
  labId: string,
  fileId: string,
  content: string,
  options: { signal?: AbortSignal } = {},
): Promise<LabDraft> {
  return request<LabDraft>(`/labs/${labId}/drafts/${fileId}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
    signal: options.signal,
  });
}

export async function deleteLabDraft(
  labId: string,
  fileId: string,
  options: { signal?: AbortSignal } = {},
): Promise<void> {
  await request<void>(`/labs/${labId}/drafts/${fileId}`, {
    method: "DELETE",
    signal: options.signal,
  });
}

export async function deleteAllLabDrafts(labId: string): Promise<void> {
  await request<void>(`/labs/${labId}/drafts`, { method: "DELETE" });
}

export async function evaluateLab(
  labId: string,
  requestBody: LabEvaluationRequest,
): Promise<LabEvaluationResponse> {
  return request<LabEvaluationResponse>(`/labs/${labId}/evaluate`, {
    method: "POST",
    body: JSON.stringify(requestBody),
  });
}

export async function revealLabHint(
  labId: string,
  hintIndex: number,
): Promise<HintRevealResponse> {
  return request<HintRevealResponse>(
    `/labs/${labId}/hints/${hintIndex}/reveal`,
    { method: "POST" },
  );
}

export async function revealLabSolution(
  labId: string,
): Promise<SolutionRevealResponse> {
  return request<SolutionRevealResponse>(`/labs/${labId}/solution/reveal`, {
    method: "POST",
  });
}

export async function listLabAttempts(
  labId: string,
): Promise<LabAttemptListResponse> {
  return request<LabAttemptListResponse>(`/labs/${labId}/attempts`);
}
