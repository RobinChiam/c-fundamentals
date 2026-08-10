import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  draftListResponseSchema,
  learningStateSchema,
  persistenceStatusSchema,
} from "@learning-app/shared";
import {
  PersistenceApiUnavailableError,
  deleteLessonDraft,
  deleteLessonDrafts,
  getLearningState,
  getLessonDrafts,
  getPersistenceStatus,
  saveLessonDraft,
  updateLessonProgress,
  visitLesson,
} from "./persistence-api";

describe("persistence api", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads persistence status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          available: true,
          database: "sqlite",
          reason: null,
        }),
      }),
    );

    const status = await getPersistenceStatus();
    expect(persistenceStatusSchema.parse(status).available).toBe(true);
  });

  it("loads learning state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          lastLessonId: "arrays",
          lessons: [],
        }),
      }),
    );

    const state = await getLearningState();
    expect(learningStateSchema.parse(state).lastLessonId).toBe("arrays");
  });

  it("throws unavailable on 503", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ error: "Persistence unavailable" }),
      }),
    );

    await expect(getLearningState()).rejects.toBeInstanceOf(
      PersistenceApiUnavailableError,
    );
  });

  it("visits lesson", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          lessonId: "arrays",
          status: "in_progress",
          lastVisitedAt: "2026-01-01T00:00:00.000Z",
          completedAt: null,
          updatedAt: "2026-01-01T00:00:00.000Z",
        }),
      }),
    );

    const progress = await visitLesson("arrays");
    expect(progress.status).toBe("in_progress");
  });

  it("updates progress", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          lessonId: "arrays",
          status: "completed",
          lastVisitedAt: "2026-01-01T00:00:00.000Z",
          completedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        }),
      }),
    );

    const progress = await updateLessonProgress("arrays", "completed");
    expect(progress.status).toBe("completed");
  });

  it("loads drafts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          lessonId: "arrays",
          drafts: [
            {
              lessonId: "arrays",
              fileId: "primary",
              content: "draft",
              updatedAt: "2026-01-01T00:00:00.000Z",
              stale: false,
            },
          ],
        }),
      }),
    );

    const drafts = await getLessonDrafts("arrays");
    expect(draftListResponseSchema.parse(drafts).drafts).toHaveLength(1);
  });

  it("saves draft", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          lessonId: "arrays",
          fileId: "primary",
          content: "draft",
          updatedAt: "2026-01-01T00:00:00.000Z",
          stale: false,
        }),
      }),
    );

    const saved = await saveLessonDraft("arrays", "primary", "draft");
    expect(saved.content).toBe("draft");
  });

  it("deletes one draft", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => null,
      }),
    );

    await expect(deleteLessonDraft("arrays", "primary")).resolves.toBeUndefined();
  });

  it("deletes all drafts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => null,
      }),
    );

    await expect(deleteLessonDrafts("arrays")).resolves.toBeUndefined();
  });
});
