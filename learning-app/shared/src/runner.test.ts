import { describe, expect, it } from "vitest";
import {
  executionResultSchema,
  runRequestSchema,
  runResponseSchema,
  runnerStatusSchema,
} from "./runner.js";

describe("runner schemas", () => {
  it("parses runner status", () => {
    expect(
      runnerStatusSchema.parse({
        available: true,
        runtime: "docker",
        image: "gcc:15.3.0-trixie",
        reason: null,
      }),
    ).toEqual({
      available: true,
      runtime: "docker",
      image: "gcc:15.3.0-trixie",
      reason: null,
    });
  });

  it("parses run request with stdin", () => {
    expect(
      runRequestSchema.parse({
        files: [{ id: "primary", content: "int main(void) { return 0; }" }],
        stdin: "hello\n",
      }),
    ).toMatchObject({ stdin: "hello\n" });
  });

  it("parses run response with null execution on compile failure", () => {
    expect(
      runResponseSchema.parse({
        compile: {
          outcome: "failed",
          exitCode: 1,
          stdout: "",
          stderr: "error",
          stdoutTruncated: false,
          stderrTruncated: false,
          diagnostics: [],
        },
        execution: null,
      }).execution,
    ).toBeNull();
  });

  it("parses execution result outcomes", () => {
    for (const outcome of [
      "success",
      "runtime_error",
      "timeout",
      "output_limit",
    ] as const) {
      expect(
        executionResultSchema.parse({
          outcome,
          exitCode: outcome === "success" ? 0 : 1,
          stdout: "",
          stderr: "",
          stdoutTruncated: false,
          stderrTruncated: false,
          durationMs: 10,
        }).outcome,
      ).toBe(outcome);
    }
  });
});
