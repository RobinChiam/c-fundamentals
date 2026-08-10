import { describe, expect, it } from "vitest";
import {
  draftListResponseSchema,
  learningStateSchema,
  persistenceStatusSchema,
  savedDraftSchema,
  saveDraftRequestSchema,
  updateProgressRequestSchema,
} from "./persistence.js";

describe("persistence schemas", () => {
  it("validates available persistence status", () => {
    const result = persistenceStatusSchema.parse({
      available: true,
      database: "sqlite",
      reason: null,
    });
    expect(result.available).toBe(true);
  });

  it("validates degraded persistence status", () => {
    const result = persistenceStatusSchema.parse({
      available: false,
      database: "sqlite",
      reason: "initialization_failed",
    });
    expect(result.reason).toBe("initialization_failed");
  });

  it("validates learning state", () => {
    const result = learningStateSchema.parse({
      lastLessonId: "arrays",
      lessons: [
        {
          lessonId: "arrays",
          status: "in_progress",
          lastVisitedAt: "2026-01-01T00:00:00.000Z",
          completedAt: null,
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
    expect(result.lessons).toHaveLength(1);
  });

  it("validates draft list response", () => {
    const result = draftListResponseSchema.parse({
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
    });
    expect(result.drafts[0]?.stale).toBe(false);
  });

  it("validates save draft request", () => {
    const result = saveDraftRequestSchema.parse({ content: "code" });
    expect(result.content).toBe("code");
  });

  it("validates update progress request", () => {
    const result = updateProgressRequestSchema.parse({ status: "completed" });
    expect(result.status).toBe("completed");
  });

  it("validates saved draft with stale flag", () => {
    const result = savedDraftSchema.parse({
      lessonId: "arrays",
      fileId: "primary",
      content: "old draft",
      updatedAt: "2026-01-01T00:00:00.000Z",
      stale: true,
    });
    expect(result.stale).toBe(true);
  });
});
