import { access } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import { CURRICULUM_MANIFEST } from "../curriculum/manifest.js";
import { createCompilerService } from "./compiler-service.js";
import { createStubProcessRunner } from "./compiler-test-utils.js";
import { validateCompileRequest } from "./compiler-workspace.js";
import {
  InvalidWorkspaceError,
  PayloadTooLargeError,
} from "./compiler-errors.js";
import { MAX_FILE_BYTES, MAX_TOTAL_SOURCE_BYTES } from "./compiler-limits.js";

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
  };
}

describe("compile workspace validation", () => {
  it("accepts a valid normal workspace", () => {
    const validated = validateCompileRequest(
      getLesson("arrays"),
      arraysWorkspace(),
    );
    expect(validated).toHaveLength(1);
    expect(validated[0]?.name).toBe("arrays.c");
  });

  it("accepts a valid Lesson 12 workspace", () => {
    expect(validateCompileRequest(getLesson("header-files-and-multiple-source-files"), lesson12Workspace())).toHaveLength(3);
  });

  it("rejects duplicate file ids", () => {
    expect(() =>
      validateCompileRequest(getLesson("arrays"), {
        files: [
          { id: "primary", content: "a" },
          { id: "primary", content: "b" },
        ],
      }),
    ).toThrow(InvalidWorkspaceError);
  });

  it("rejects unknown file ids", () => {
    expect(() =>
      validateCompileRequest(getLesson("arrays"), {
        files: [{ id: "unknown", content: "a" }],
      }),
    ).toThrow(InvalidWorkspaceError);
  });

  it("rejects missing expected files", () => {
    expect(() =>
      validateCompileRequest(getLesson("arrays"), { files: [] }),
    ).toThrow(InvalidWorkspaceError);
  });

  it("rejects solution requests", () => {
    expect(() =>
      validateCompileRequest(getLesson("arrays"), {
        files: [
          { id: "primary", content: "a" },
          { id: "solution", content: "b" },
        ],
      }),
    ).toThrow(InvalidWorkspaceError);
  });

  it("rejects readme requests", () => {
    expect(() =>
      validateCompileRequest(getLesson("arrays"), {
        files: [
          { id: "primary", content: "a" },
          { id: "readme", content: "# Readme" },
        ],
      }),
    ).toThrow(InvalidWorkspaceError);
  });

  it("rejects oversized files", () => {
    expect(() =>
      validateCompileRequest(getLesson("arrays"), {
        files: [{ id: "primary", content: "x".repeat(MAX_FILE_BYTES + 1) }],
      }),
    ).toThrow(PayloadTooLargeError);
  });

  it("rejects oversized total requests", () => {
    const chunk = "x".repeat(Math.floor(MAX_TOTAL_SOURCE_BYTES / 2) + 1);
    expect(() =>
      validateCompileRequest(
        getLesson("header-files-and-multiple-source-files"),
        {
          files: [
            { id: "primary", content: chunk },
            { id: "geometry", content: chunk },
            { id: "geometry-header", content: "h" },
          ],
        },
      ),
    ).toThrow(PayloadTooLargeError);
  });
});

describe("compiler service", () => {
  it("handles gcc unavailable", async () => {
    const service = createCompilerService({
      processRunner: createStubProcessRunner(async () => ({
        exitCode: 1,
        stdout: "",
        stderr: "missing",
        stdoutTruncated: false,
        stderrTruncated: false,
        timedOut: false,
        spawnError: true,
        shellUsed: false,
      })),
    });

    const status = await service.getStatus();
    expect(status.available).toBe(false);

    await expect(
      service.compileLesson("arrays", arraysWorkspace()),
    ).rejects.toMatchObject({ name: "CompilerUnavailableError" });
  });

  it("uses manifest filenames and temp workspace for compilation", async () => {
    let observedCwd = "";
    let observedArgs: string[] = [];

    const service = createCompilerService({
      processRunner: createStubProcessRunner(async (options) => {
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

        observedCwd = options.cwd;
        observedArgs = options.args;
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
      }),
    });

    const response = await service.compileLesson("arrays", arraysWorkspace());

    expect(response.outcome).toBe("success");
    expect(observedArgs).toContain("arrays.c");
    expect(observedCwd).toContain("c-fundamentals-compile-");
    await expect(access(observedCwd)).rejects.toThrow();
  });

  it("returns failed outcome for non-zero GCC exit codes", async () => {
    const service = createCompilerService({
      processRunner: createStubProcessRunner(async (options) => {
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

        return {
          exitCode: 1,
          stdout: "",
          stderr: "arrays.c:1:1: error: expected identifier",
          stdoutTruncated: false,
          stderrTruncated: false,
          timedOut: false,
          spawnError: false,
          shellUsed: false,
        };
      }),
    });

    const response = await service.compileLesson("arrays", {
      files: [{ id: "primary", content: "not valid c" }],
    });

    expect(response.outcome).toBe("failed");
    expect(response.diagnostics[0]?.severity).toBe("error");
  });

  it("returns timeout outcome", async () => {
    const service = createCompilerService({
      processRunner: createStubProcessRunner(async (options) => {
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

        return {
          exitCode: null,
          stdout: "",
          stderr: "",
          stdoutTruncated: false,
          stderrTruncated: false,
          timedOut: true,
          spawnError: false,
          shellUsed: false,
        };
      }),
    });

    const response = await service.compileLesson("arrays", arraysWorkspace());
    expect(response.outcome).toBe("timeout");
  });

  it("cleans up temp workspace after failure", async () => {
    let observedCwd = "";
    const service = createCompilerService({
      processRunner: createStubProcessRunner(async (options) => {
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

        observedCwd = options.cwd;
        return {
          exitCode: 1,
          stdout: "",
          stderr: "arrays.c:1:1: error: bad",
          stdoutTruncated: false,
          stderrTruncated: false,
          timedOut: false,
          spawnError: false,
          shellUsed: false,
        };
      }),
    });

    await service.compileLesson("arrays", arraysWorkspace());
    await expect(access(observedCwd)).rejects.toThrow();
  });

  it("cleans up temp workspace after spawn error", async () => {
    let observedCwd = "";
    const service = createCompilerService({
      processRunner: createStubProcessRunner(async (options) => {
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

        observedCwd = options.cwd;
        return {
          exitCode: null,
          stdout: "",
          stderr: "",
          stdoutTruncated: false,
          stderrTruncated: false,
          timedOut: false,
          spawnError: true,
          shellUsed: false,
        };
      }),
    });

    await expect(service.compileLesson("arrays", arraysWorkspace())).rejects.toThrow();
    await expect(access(observedCwd)).rejects.toThrow();
  });

  it("never launches the executable", async () => {
    const runMock = vi.fn(async (options: { args: string[] }) => {
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

    const service = createCompilerService({
      processRunner: createStubProcessRunner(runMock),
    });

    await service.compileLesson("arrays", arraysWorkspace());

    const compileCalls = runMock.mock.calls.filter(
      ([options]) => !options.args.includes("--version"),
    );
    expect(compileCalls).toHaveLength(1);
    expect(compileCalls[0]?.[0].args[0]).toBe("-std=c17");
  });
});

describe("gcc integration", () => {
  it("compiles valid C when GCC is available", async () => {
    const probe = createCompilerService();
    const status = await probe.getStatus();
    if (!status.available) {
      return;
    }

    const service = createCompilerService();
    const response = await service.compileLesson("arrays", arraysWorkspace());
    expect(response.outcome).toBe("success");
  });
});
