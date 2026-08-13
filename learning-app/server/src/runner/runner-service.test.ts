import { access, stat } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { CURRICULUM_MANIFEST } from "../curriculum/manifest.js";
import { validateCompileRequest } from "../compiler/compiler-workspace.js";
import {
  InvalidWorkspaceError,
  PayloadTooLargeError,
} from "../compiler/compiler-errors.js";
import { BASE_GCC_FLAGS } from "../compiler/compiler-limits.js";
import { buildCompileDockerArgs } from "./docker-runtime.js";
import { MAX_STDIN_BYTES, RUNNER_IMAGE } from "./runner-config.js";
import { SANDBOX_WORKSPACE_DIR_MODE } from "./sandbox-workspace.js";
import { createRunnerService } from "./runner-service.js";
import {
  createReadyDockerRunner,
  isSandboxCompileRun,
  statusProbeRunner,
  successfulDockerResult,
} from "./runner-test-utils.js";
import { RunnerUnavailableError } from "./runner-errors.js";

function getLesson(id: string) {
  const lesson = CURRICULUM_MANIFEST.find((entry) => entry.id === id);
  if (!lesson) {
    throw new Error(`Missing lesson fixture: ${id}`);
  }
  return lesson;
}

function arraysWorkspace(content = "int main(void) { return 0; }") {
  return {
    files: [{ id: "primary", content }],
    stdin: "",
  };
}

function lesson12Workspace(
  overrides: Partial<Record<string, string>> = {},
) {
  return {
    files: [
      { id: "primary", content: overrides.primary ?? "int main(void) { return 0; }" },
      { id: "geometry", content: overrides.geometry ?? "/* geometry */" },
      { id: "geometry-header", content: overrides["geometry-header"] ?? "/* header */" },
    ],
    stdin: "",
  };
}

function lesson14Workspace() {
  return {
    files: [
      { id: "primary", content: "int main(void) { return 0; }" },
      { id: "task", content: "/* task */" },
      { id: "task-header", content: "/* task.h */" },
      { id: "store", content: "/* store */" },
      { id: "store-header", content: "/* store.h */" },
      { id: "util", content: "/* util */" },
      { id: "util-header", content: "/* util.h */" },
    ],
    stdin: "1\n",
  };
}

function readyRunner(
  handler: (
    options: DockerRunOptions,
    phase: "compile" | "execute",
  ) => DockerRunResult | Promise<DockerRunResult>,
) {
  const recorded = createReadyDockerRunner(handler);
  const service = createRunnerService({ dockerRunner: recorded.runner });
  return { service, ...recorded };
}

describe("run workspace validation via runner service", () => {
  it("accepts a valid normal workspace", async () => {
    validateCompileRequest(getLesson("arrays"), {
      files: arraysWorkspace().files,
    });
  });

  it("accepts Lesson 12 and Lesson 14 workspaces", () => {
    expect(
      validateCompileRequest(
        getLesson("header-files-and-multiple-source-files"),
        lesson12Workspace(),
      ),
    ).toHaveLength(3);
    expect(
      validateCompileRequest(
        getLesson("intermediate-console-project"),
        lesson14Workspace(),
      ),
    ).toHaveLength(7);
  });

  it("rejects solution and readme requests", () => {
    expect(() =>
      validateCompileRequest(getLesson("arrays"), {
        files: [
          { id: "primary", content: "a" },
          { id: "solution", content: "b" },
        ],
      }),
    ).toThrow(InvalidWorkspaceError);

    expect(() =>
      validateCompileRequest(getLesson("arrays"), {
        files: [
          { id: "primary", content: "a" },
          { id: "readme", content: "# Readme" },
        ],
      }),
    ).toThrow(InvalidWorkspaceError);
  });
});

describe("runner service", () => {
  it("rejects run when runner is unavailable", async () => {
    const service = createRunnerService({
      dockerRunner: statusProbeRunner({ imageAvailable: false }),
    });

    await expect(service.runLesson("arrays", arraysWorkspace())).rejects.toBeInstanceOf(
      RunnerUnavailableError,
    );
  });

  it("rejects oversized stdin before Docker starts", async () => {
    const recorded = createReadyDockerRunner(async () => successfulDockerResult());
    const runnerService = createRunnerService({ dockerRunner: recorded.runner });

    await expect(
      runnerService.runLesson("arrays", {
        files: arraysWorkspace().files,
        stdin: "x".repeat(MAX_STDIN_BYTES + 1),
      }),
    ).rejects.toBeInstanceOf(PayloadTooLargeError);

    expect(
      recorded.calls.filter((call) => isSandboxCompileRun(call.args)),
    ).toHaveLength(0);
  });

  it("uses sandbox compile then execution with trusted build spec", async () => {
    const { service, calls } = readyRunner(async (_options, phase) => {
      if (phase === "compile") {
        return successfulDockerResult({ exitCode: 0 });
      }
      return successfulDockerResult({
        exitCode: 0,
        stdout: "hello\n",
      });
    });

    const response = await service.runLesson("arrays", {
      ...arraysWorkspace('int main(void) { puts("hello"); return 0; }'),
      stdin: "ignored\n",
    });

    expect(response.compile.outcome).toBe("success");
    expect(response.execution?.outcome).toBe("success");
    expect(response.execution?.stdout).toBe("hello\n");
    expect(calls.filter((call) => isSandboxCompileRun(call.args))).toHaveLength(1);
    expect(calls.filter((call) => call.args.includes("--entrypoint"))).toHaveLength(1);

    const compileCall = calls.find((call) => isSandboxCompileRun(call.args));
    expect(compileCall?.args[0]).toBe("run");
    expect(compileCall?.args).toContain(RUNNER_IMAGE);
    expect(compileCall?.args).toContain("gcc");

    const gccIndex = compileCall?.args.indexOf("gcc") ?? -1;
    const gccArgs = compileCall?.args.slice(gccIndex + 1) ?? [];
    expect(gccArgs.slice(0, BASE_GCC_FLAGS.length)).toEqual([...BASE_GCC_FLAGS]);
    expect(gccArgs).toContain("arrays.c");
    expect(gccArgs).toContain("-o");
    expect(gccArgs).toContain("program");

    const executeCall = calls.find((call) => call.args.includes("--entrypoint"));
    expect(executeCall?.stdin).toBe("ignored\n");
    expect(executeCall?.killOnOutputLimit).toBe(true);
    expect(executeCall?.args).toContain("--entrypoint");
    expect(executeCall?.args).toContain("/workspace/program");
  });

  it("proceeds to execution after container compile without host chmod", async () => {
    const { service, calls } = readyRunner(async (_options, phase) => {
      if (phase === "compile") {
        return successfulDockerResult({ exitCode: 0 });
      }
      return successfulDockerResult({ exitCode: 0, stdout: "ok\n" });
    });

    const response = await service.runLesson("arrays", arraysWorkspace());

    expect(response.compile.outcome).toBe("success");
    expect(response.execution?.outcome).toBe("success");
    expect(response.execution?.stdout).toBe("ok\n");
    expect(calls.filter((call) => isSandboxCompileRun(call.args))).toHaveLength(1);
    expect(calls.filter((call) => call.args.includes("--entrypoint"))).toHaveLength(1);
  });

  it("returns compile failure without executing", async () => {
    const { service, calls } = readyRunner(async (_options, phase) => {
      if (phase === "compile") {
        return successfulDockerResult({
          exitCode: 1,
          stderr: "arrays.c:1:1: error: expected identifier",
        });
      }
      throw new Error("execution should not run");
    });

    const response = await service.runLesson("arrays", {
      files: [{ id: "primary", content: "bad syntax" }],
      stdin: "",
    });

    expect(response.compile.outcome).toBe("failed");
    expect(response.execution).toBeNull();
    expect(response.compile.diagnostics[0]?.message).toBe("expected identifier");
    expect(calls.filter((call) => call.args.includes("--entrypoint"))).toHaveLength(0);
  });

  it("maps runtime_error, timeout, and output_limit outcomes", async () => {
    const nonZero = readyRunner(async (_options, phase) =>
      phase === "compile"
        ? successfulDockerResult({ exitCode: 0 })
        : successfulDockerResult({ exitCode: 2, stderr: "boom" }),
    );
    expect((await nonZero.service.runLesson("arrays", arraysWorkspace())).execution?.outcome).toBe(
      "runtime_error",
    );

    const timeout = readyRunner(async (_options, phase) =>
      phase === "compile"
        ? successfulDockerResult({ exitCode: 0 })
        : successfulDockerResult({ timedOut: true, exitCode: null }),
    );
    const timeoutResponse = await timeout.service.runLesson("arrays", arraysWorkspace());
    expect(timeoutResponse.execution?.outcome).toBe("timeout");
    expect(timeout.killCalls.length + timeout.removeCalls.length).toBeGreaterThan(0);

    const outputLimit = readyRunner(async (_options, phase) =>
      phase === "compile"
        ? successfulDockerResult({ exitCode: 0 })
        : successfulDockerResult({
            outputLimitExceeded: true,
            stdout: "x".repeat(100),
            stdoutTruncated: true,
            exitCode: null,
          }),
    );
    const outputResponse = await outputLimit.service.runLesson("arrays", arraysWorkspace());
    expect(outputResponse.execution?.outcome).toBe("output_limit");
    expect(outputLimit.killCalls.length + outputLimit.removeCalls.length).toBeGreaterThan(0);
  });

  it("builds Lesson 12 compile args with math link flag", async () => {
    const { service, calls } = readyRunner(async () => successfulDockerResult());

    await service.runLesson(
      "header-files-and-multiple-source-files",
      lesson12Workspace(),
    );

    const compileCall = calls.find((call) => isSandboxCompileRun(call.args));
    const gccIndex = compileCall?.args.indexOf("gcc") ?? -1;
    const gccArgs = compileCall?.args.slice(gccIndex + 1) ?? [];
    expect(gccArgs).toContain("main.c");
    expect(gccArgs).toContain("geometry.c");
    expect(gccArgs).not.toContain("geometry.h");
    expect(gccArgs.at(-1)).toBe("-lm");
  });

  it("builds Lesson 14 compile args with all support sources", async () => {
    const { service, calls } = readyRunner(async () => successfulDockerResult());

    await service.runLesson("intermediate-console-project", lesson14Workspace());

    const compileCall = calls.find((call) => isSandboxCompileRun(call.args));
    const gccIndex = compileCall?.args.indexOf("gcc") ?? -1;
    const gccArgs = compileCall?.args.slice(gccIndex + 1) ?? [];
    expect(gccArgs).toContain("main.c");
    expect(gccArgs).toContain("task.c");
    expect(gccArgs).toContain("store.c");
    expect(gccArgs).toContain("util.c");
  });

  it("never includes browser-controlled docker options", async () => {
    const hostPath = "/tmp/c-fundamentals-run-test";
    const args = buildCompileDockerArgs({
      containerName: "cfund-compile-test",
      hostWorkspacePath: hostPath,
      gccArgs: ["main.c"],
    });

    expect(args).not.toContain("ignored\n");
    expect(args).not.toContain("solution.c");
    expect(args).not.toContain("README.md");
  });

  it("creates and cleans up temp workspace without host execution", async () => {
    let observedHostMount = "";
    const { service } = readyRunner(async (options, phase) => {
      if (phase === "compile") {
        const mount = options.args.find((arg) => arg.includes(":/workspace"));
        observedHostMount = mount?.split(":")[0] ?? "";
        expect(observedHostMount).toContain("c-fundamentals-run-");
        expect(observedHostMount).not.toContain("learning-app");
        const workspaceStat = await stat(observedHostMount);
        expect(workspaceStat.mode & 0o0777).toBe(SANDBOX_WORKSPACE_DIR_MODE);
        return successfulDockerResult({ exitCode: 0 });
      }
      return successfulDockerResult({ exitCode: 0, stdout: "ok" });
    });

    await service.runLesson("arrays", arraysWorkspace());

    await expect(access(observedHostMount)).rejects.toThrow();
  });
});

describe("docker integration", () => {
  it.runIf(process.env.CFUND_DOCKER_TESTS === "1")(
    "runs hello world in real Docker",
    async () => {
      const service = createRunnerService({
        dockerRunner: statusProbeRunner({}),
      });
      const status = await service.getStatus();
      if (!status.available) {
        return;
      }

      const response = await service.runLesson(
        "arrays",
        arraysWorkspace(
          '#include <stdio.h>\nint main(void) { puts("hello"); return 0; }',
        ),
      );

      expect(response.compile.outcome).toBe("success");
      expect(response.execution?.outcome).toBe("success");
      expect(response.execution?.stdout).toContain("hello");
    },
  );
});
