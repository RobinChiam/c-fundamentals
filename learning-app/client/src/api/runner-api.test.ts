import { afterEach, describe, expect, it, vi } from "vitest";
import {
  RunnerApiError,
  getRunnerStatus,
  runLesson,
} from "./runner-api";

describe("runner api", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses runner status through shared schema", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          available: true,
          runtime: "docker",
          image: "gcc:15.3.0-trixie",
          reason: null,
        }),
      }),
    );

    await expect(getRunnerStatus()).resolves.toEqual({
      available: true,
      runtime: "docker",
      image: "gcc:15.3.0-trixie",
      reason: null,
    });
  });

  it("submits stdin and workspace files", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        compile: {
          outcome: "success",
          exitCode: 0,
          stdout: "",
          stderr: "",
          stdoutTruncated: false,
          stderrTruncated: false,
          diagnostics: [],
        },
        execution: {
          outcome: "success",
          exitCode: 0,
          stdout: "hello\n",
          stderr: "",
          stdoutTruncated: false,
          stderrTruncated: false,
          durationMs: 12,
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await runLesson(
      "arrays",
      [{ id: "primary", content: "draft" }],
      "input\n",
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lessons/arrays/run",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          files: [{ id: "primary", content: "draft" }],
          stdin: "input\n",
        }),
      }),
    );
  });

  it("throws typed errors for failed requests", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ error: "unavailable" }),
      }),
    );

    await expect(runLesson("arrays", [], "")).rejects.toBeInstanceOf(RunnerApiError);
  });
});
