import { afterAll, describe, expect, it } from "vitest";
import { compileResponseSchema, compilerStatusSchema } from "@learning-app/shared";
import { buildApp } from "../app.js";
import { createCompilerService } from "../compiler/compiler-service.js";
import { createStubProcessRunner } from "../compiler/compiler-test-utils.js";

function availableRunner() {
  return createStubProcessRunner(async (options) => {
    if (options.args.includes("--version")) {
      return {
        exitCode: 0,
        stdout: "gcc (GCC) 14.0.0\n",
        stderr: "",
        stdoutTruncated: false,
        stderrTruncated: false,
        timedOut: false,
        spawnError: false,
        shellUsed: false,
      };
    }

    const hasSyntaxError = options.args.some((arg) => arg.includes("bad.c"));
    if (hasSyntaxError) {
      return {
        exitCode: 1,
        stdout: "",
        stderr: "bad.c:1:1: error: expected identifier",
        stdoutTruncated: false,
        stderrTruncated: false,
        timedOut: false,
        spawnError: false,
        shellUsed: false,
      };
    }

    return {
      exitCode: 0,
      stdout: "",
      stderr: "",
      stdoutTruncated: false,
      stderrTruncated: false,
      timedOut: false,
      spawnError: false,
      shellUsed: false,
    };
  });
}

describe("compiler routes", () => {
  const availableAppPromise = buildApp({
    compilerService: createCompilerService({
      processRunner: availableRunner(),
    }),
  });

  const unavailableAppPromise = buildApp({
    compilerService: createCompilerService({
      processRunner: createStubProcessRunner(async () => ({
        exitCode: 1,
        stdout: "",
        stderr: "",
        stdoutTruncated: false,
        stderrTruncated: false,
        timedOut: false,
        spawnError: true,
        shellUsed: false,
      })),
    }),
  });

  afterAll(async () => {
    await (await availableAppPromise).close();
    await (await unavailableAppPromise).close();
  });

  it("returns compiler status when available", async () => {
    const app = await availableAppPromise;
    const response = await app.inject({ method: "GET", url: "/api/compiler/status" });

    expect(response.statusCode).toBe(200);
    expect(compilerStatusSchema.parse(JSON.parse(response.body))).toEqual({
      available: true,
      compiler: "gcc",
      version: "gcc (GCC) 14.0.0",
    });
  });

  it("returns compiler status when unavailable", async () => {
    const app = await unavailableAppPromise;
    const response = await app.inject({ method: "GET", url: "/api/compiler/status" });

    expect(response.statusCode).toBe(200);
    expect(compilerStatusSchema.parse(JSON.parse(response.body))).toEqual({
      available: false,
      compiler: "gcc",
      version: null,
    });
  });

  it("returns 200 for successful compile", async () => {
    const app = await availableAppPromise;
    const response = await app.inject({
      method: "POST",
      url: "/api/lessons/arrays/compile",
      payload: {
        files: [{ id: "primary", content: "int main(void) { return 0; }" }],
      },
    });

    expect(response.statusCode).toBe(200);
    expect(compileResponseSchema.parse(JSON.parse(response.body)).outcome).toBe(
      "success",
    );
  });

  it("returns 200 for learner compile failure", async () => {
    const failingApp = await buildApp({
      compilerService: {
        getStatus: async () => ({
          available: true,
          compiler: "gcc" as const,
          version: "gcc (GCC) 14.0.0",
        }),
        compileLesson: async () => ({
          outcome: "failed" as const,
          exitCode: 1,
          stdout: "",
          stderr: "arrays.c:1:1: error: expected identifier",
          stdoutTruncated: false,
          stderrTruncated: false,
          diagnostics: [
            {
              severity: "error" as const,
              fileName: "arrays.c",
              fileId: "primary",
              line: 1,
              column: 1,
              message: "expected identifier",
            },
          ],
        }),
      },
    });

    const response = await failingApp.inject({
      method: "POST",
      url: "/api/lessons/arrays/compile",
      payload: {
        files: [{ id: "primary", content: "bad syntax" }],
      },
    });

    expect(response.statusCode).toBe(200);
    expect(compileResponseSchema.parse(JSON.parse(response.body)).outcome).toBe(
      "failed",
    );

    await failingApp.close();
  });

  it("returns 503 when compiler is unavailable", async () => {
    const app = await unavailableAppPromise;
    const response = await app.inject({
      method: "POST",
      url: "/api/lessons/arrays/compile",
      payload: {
        files: [{ id: "primary", content: "int main(void) { return 0; }" }],
      },
    });

    expect(response.statusCode).toBe(503);
  });

  it("returns 404 for unknown lesson", async () => {
    const app = await availableAppPromise;
    const response = await app.inject({
      method: "POST",
      url: "/api/lessons/missing-lesson/compile",
      payload: {
        files: [{ id: "primary", content: "int main(void) { return 0; }" }],
      },
    });

    expect(response.statusCode).toBe(404);
  });

  it("returns 400 for invalid workspace", async () => {
    const app = await availableAppPromise;
    const response = await app.inject({
      method: "POST",
      url: "/api/lessons/arrays/compile",
      payload: {
        files: [{ id: "solution", content: "int main(void) { return 0; }" }],
      },
    });

    expect(response.statusCode).toBe(400);
  });
});
