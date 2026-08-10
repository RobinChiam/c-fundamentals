import { describe, expect, it } from "vitest";
import { getLessonDisplayStatus, formatLessonDisplayStatus } from "../components/LessonCard";

describe("lesson display status", () => {
  it("maps missing progress to not started", () => {
    expect(getLessonDisplayStatus("arrays", new Map())).toBe("not_started");
    expect(formatLessonDisplayStatus("not_started")).toBe("Not started");
  });

  it("maps in progress and completed statuses", () => {
    const progress = new Map([
      [
        "arrays",
        {
          lessonId: "arrays",
          status: "in_progress" as const,
          lastVisitedAt: "2026-01-01T00:00:00.000Z",
          completedAt: null,
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    ]);
    expect(getLessonDisplayStatus("arrays", progress)).toBe("in_progress");
    expect(formatLessonDisplayStatus("in_progress")).toBe("In progress");
    expect(formatLessonDisplayStatus("completed")).toBe("Completed");
  });
});
