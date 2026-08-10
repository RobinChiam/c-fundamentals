import { afterAll, describe, expect, it } from "vitest";
import { runResponseSchema, runnerStatusSchema } from "@learning-app/shared";
import { buildApp } from "../app.js";
import { MAX_STDIN_BYTES } from "../runner/runner-config.js";
import { createRunnerService } from "../runner/runner-service.js";
import {
  createReadyDockerRunner,
  statusProbeRunner,
  successfulDockerResult,
} from "../runner/runner-test-utils.js";

describe("runner routes", () => {
  const readyRecorded = createReadyDockerRunner(async (_options, phase) => {
    if (phase === "compile") {
      return successfulDockerResult({ exitCode: 0 });
    }
    return successfulDockerResult({ exitCode: 0, stdout: "done\n" });
  });

  const readyAppPromise = buildApp({
    runnerService: createRunnerService({ dockerRunner: readyRecorded.runner }),
  });

  const unavailableAppPromise = buildApp({
    runnerService: createRunnerService({
      dockerRunner: statusProbeRunner({ imageAvailable: false }),
    }),
  });

  afterAll(async () => {
    await (await readyAppPromise).close();
    await (await unavailableAppPromise).close();
  });

  it("returns runner status", async () => {
    const app = await buildApp({
      runnerService: createRunnerService({
        dockerRunner: statusProbeRunner({}),
      }),
    });

    const response = await app.inject({ method: "GET", url: "/api/runner/status" });
    expect(response.statusCode).toBe(200);
    expect(runnerStatusSchema.parse(JSON.parse(response.body)).available).toBe(true);
    await app.close();
  });

  it("returns 200 for successful run", async () => {
    const app = await readyAppPromise;
    const response = await app.inject({
      method: "POST",
      url: "/api/lessons/arrays/run",
      payload: {
        files: [{ id: "primary", content: "int main(void) { return 0; }" }],
        stdin: "abc\n",
      },
    });

    expect(response.statusCode).toBe(200);
    const body = runResponseSchema.parse(JSON.parse(response.body));
    expect(body.compile.outcome).toBe("success");
    expect(body.execution?.stdout).toBe("done\n");
  });

  it("returns 503 when runner unavailable", async () => {
    const app = await unavailableAppPromise;
    const response = await app.inject({
      method: "POST",
      url: "/api/lessons/arrays/run",
      payload: {
        files: [{ id: "primary", content: "int main(void) { return 0; }" }],
        stdin: "",
      },
    });

    expect(response.statusCode).toBe(503);
  });

  it("returns 404 for unknown lesson", async () => {
    const app = await readyAppPromise;
    const response = await app.inject({
      method: "POST",
      url: "/api/lessons/missing-lesson/run",
      payload: {
        files: [{ id: "primary", content: "int main(void) { return 0; }" }],
        stdin: "",
      },
    });

    expect(response.statusCode).toBe(404);
  });

  it("returns 400 for invalid workspace", async () => {
    const app = await readyAppPromise;
    const response = await app.inject({
      method: "POST",
      url: "/api/lessons/arrays/run",
      payload: {
        files: [{ id: "solution", content: "int main(void) { return 0; }" }],
        stdin: "",
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 413 for oversized stdin", async () => {
    const app = await readyAppPromise;
    const response = await app.inject({
      method: "POST",
      url: "/api/lessons/arrays/run",
      payload: {
        files: [{ id: "primary", content: "int main(void) { return 0; }" }],
        stdin: "x".repeat(MAX_STDIN_BYTES + 1),
      },
    });

    expect(response.statusCode).toBe(413);
  });

  it("returns 200 for compile failure without execution", async () => {
    const recorded = createReadyDockerRunner(async (_options, phase) => {
      if (phase === "compile") {
        return successfulDockerResult({
          exitCode: 1,
          stderr: "arrays.c:1:1: error: expected identifier",
        });
      }
      throw new Error("execution should not run");
    });
    const app = await buildApp({
      runnerService: createRunnerService({ dockerRunner: recorded.runner }),
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/lessons/arrays/run",
      payload: {
        files: [{ id: "primary", content: "bad syntax" }],
        stdin: "",
      },
    });

    expect(response.statusCode).toBe(200);
    const body = runResponseSchema.parse(JSON.parse(response.body));
    expect(body.compile.outcome).toBe("failed");
    expect(body.execution).toBeNull();
    await app.close();
  });
});
