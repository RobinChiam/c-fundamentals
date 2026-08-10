import { afterEach, describe, expect, it, vi } from "vitest";
import {
  curriculumResponseSchema,
  lessonDetailSchema,
  lessonFileContentSchema,
} from "@learning-app/shared";
import {
  CurriculumApiError,
  CurriculumApiNotFoundError,
  CurriculumApiValidationError,
  getLesson,
  getLessonFile,
  listCurriculum,
} from "./curriculum-api";
import {
  mockArraysLesson,
  mockCurriculumResponse,
  mockPrimarySourceContent,
} from "../test-fixtures/curriculum";

describe("curriculum-api", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses curriculum responses through the shared schema", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockCurriculumResponse,
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await listCurriculum();

    expect(fetchMock).toHaveBeenCalledWith("/api/curriculum");
    expect(curriculumResponseSchema.parse(result)).toEqual(mockCurriculumResponse);
  });

  it("parses lesson detail responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockArraysLesson,
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getLesson("arrays");

    expect(fetchMock).toHaveBeenCalledWith("/api/lessons/arrays");
    expect(lessonDetailSchema.parse(result)).toEqual(mockArraysLesson);
  });

  it("parses lesson file content responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPrimarySourceContent,
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getLessonFile("arrays", "primary");

    expect(fetchMock).toHaveBeenCalledWith("/api/lessons/arrays/files/primary");
    expect(lessonFileContentSchema.parse(result)).toEqual(mockPrimarySourceContent);
  });

  it("distinguishes 404 responses from generic request failures", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: "Lesson not found" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Server error" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getLesson("missing")).rejects.toBeInstanceOf(
      CurriculumApiNotFoundError,
    );
    await expect(getLesson("arrays")).rejects.toBeInstanceOf(CurriculumApiError);
  });

  it("rejects malformed successful API data", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ lessons: [{ id: "broken" }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(listCurriculum()).rejects.toBeInstanceOf(
      CurriculumApiValidationError,
    );
  });

  it("treats network failures as generic request errors", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getLessonFile("arrays", "readme")).rejects.toBeInstanceOf(
      CurriculumApiError,
    );
    await expect(getLessonFile("arrays", "readme")).rejects.not.toBeInstanceOf(
      CurriculumApiNotFoundError,
    );
  });
});
