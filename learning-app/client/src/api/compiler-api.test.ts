import { afterEach, describe, expect, it, vi } from "vitest";
import {
  compileResponseSchema,
  compilerStatusSchema,
} from "@learning-app/shared";
import {
  CompilerApiError,
  CompilerApiValidationError,
  buildCompileRequestFromWorkspace,
  compileLesson,
  getCompilerStatus,
} from "./compiler-api";

describe("compiler-api", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses compiler status through the shared schema", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        available: true,
        compiler: "gcc",
        version: "gcc (GCC) 14.0.0",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getCompilerStatus();
    expect(compilerStatusSchema.parse(result)).toEqual({
      available: true,
      compiler: "gcc",
      version: "gcc (GCC) 14.0.0",
    });
  });

  it("parses compile responses through the shared schema", async () => {
    const responseBody = {
      outcome: "failed",
      exitCode: 1,
      stdout: "",
      stderr: "arrays.c:1:1: error: expected identifier",
      stdoutTruncated: false,
      stderrTruncated: false,
      diagnostics: [],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => responseBody,
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await compileLesson("arrays", {
      files: [{ id: "primary", content: "bad" }],
    });

    expect(compileResponseSchema.parse(result)).toEqual(responseBody);
    expect(fetchMock).toHaveBeenCalledWith("/api/lessons/arrays/compile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: [{ id: "primary", content: "bad" }] }),
    });
  });

  it("submits full workspace drafts without solution", () => {
    const request = buildCompileRequestFromWorkspace([
      {
        id: "primary",
        draftContent: "main draft",
        role: "primary",
      },
      {
        id: "geometry",
        draftContent: "support draft",
        role: "support",
      },
      {
        id: "geometry-header",
        draftContent: "header draft",
        role: "header",
      },
      {
        id: "solution",
        draftContent: "secret",
        role: "solution",
      },
    ]);

    expect(request.files).toEqual([
      { id: "primary", content: "main draft" },
      { id: "geometry", content: "support draft" },
      { id: "geometry-header", content: "header draft" },
    ]);
  });

  it("does not mutate drafts when building compile requests", () => {
    const workspaceFile = {
      id: "primary",
      draftContent: "draft",
      role: "primary",
    };
    const before = { ...workspaceFile };
    buildCompileRequestFromWorkspace([workspaceFile]);
    expect(workspaceFile).toEqual(before);
  });

  it("treats non-OK compile responses as errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: "GCC unavailable" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      compileLesson("arrays", { files: [{ id: "primary", content: "x" }] }),
    ).rejects.toBeInstanceOf(CompilerApiError);
  });

  it("rejects malformed successful compile data", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ outcome: "broken" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      compileLesson("arrays", { files: [{ id: "primary", content: "x" }] }),
    ).rejects.toBeInstanceOf(CompilerApiValidationError);
  });
});
