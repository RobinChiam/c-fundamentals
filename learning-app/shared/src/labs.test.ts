import { describe, expect, it } from "vitest";
import {
  labDetailSchema,
  labEvaluationResponseSchema,
  labSummarySchema,
} from "./labs.js";

describe("shared lab contracts", () => {
  it("parses lab summary", () => {
    const parsed = labSummarySchema.parse({
      id: "conditional-leap-year",
      lessonId: "conditional-statements",
      exerciseNumber: 1,
      title: "Leap Year Check",
      revision: 1,
      status: "not_started",
    });
    expect(parsed.id).toBe("conditional-leap-year");
  });

  it("parses lab detail without private fields", () => {
    const parsed = labDetailSchema.parse({
      id: "conditional-leap-year",
      lessonId: "conditional-statements",
      exerciseNumber: 1,
      title: "Leap Year Check",
      revision: 1,
      prompt: "Implement is_leap_year.",
      concepts: ["if / else"],
      starterFiles: [
        {
          id: "submission",
          name: "submission.c",
          language: "c",
          content: "int is_leap_year(int year) { return 0; }",
        },
      ],
      publicTests: [
        { id: "t1", title: "Public test", visibility: "public" },
      ],
      hiddenTests: [
        { id: "t2", title: "Hidden test", visibility: "hidden" },
      ],
      revealedHints: [],
      solutionRevealed: false,
      status: "not_started",
      progress: {
        hintsRevealed: 0,
        solutionRevealed: false,
        completedAt: null,
        lastAttemptAt: null,
      },
    });
    expect(parsed.hiddenTests[0]?.visibility).toBe("hidden");
  });

  it("parses evaluation response", () => {
    const parsed = labEvaluationResponseSchema.parse({
      outcome: "failed",
      passedTests: 1,
      totalTests: 3,
      testResults: [
        {
          id: "t1",
          title: "Test",
          visibility: "hidden",
          passed: false,
        },
      ],
      compileDiagnostics: [],
      attemptPersisted: true,
    });
    expect(parsed.outcome).toBe("failed");
  });
});
