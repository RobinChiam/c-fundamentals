import { describe, expect, it, vi, beforeEach } from "vitest";
import { spawn } from "node:child_process";
import {
  buildGccArgumentArray,
  createSpawnProcessRunner,
  getPlatformExecutableName,
} from "./compiler-process.js";
import { BASE_GCC_FLAGS } from "./compiler-limits.js";

vi.mock("node:child_process", () => ({
  spawn: vi.fn(),
}));

function createMockChild(options: {
  stdout?: string;
  stderr?: string;
  exitCode?: number | null;
  error?: Error;
  delayMs?: number;
}) {
  const handlers: Record<string, Array<(value?: unknown) => void>> = {};
  const child = {
    stdout: {
      on(event: string, handler: (chunk: Buffer) => void) {
        if (event === "data" && options.stdout) {
          setImmediate(() => handler(Buffer.from(options.stdout ?? "")));
        }
      },
    },
    stderr: {
      on(event: string, handler: (chunk: Buffer) => void) {
        if (event === "data" && options.stderr) {
          setImmediate(() => handler(Buffer.from(options.stderr ?? "")));
        }
      },
    },
    on(event: string, handler: (value?: unknown) => void) {
      handlers[event] ??= [];
      handlers[event].push(handler);

      if (event === "error" && options.error) {
        setImmediate(() => handler(options.error));
        return;
      }

      if (event === "close") {
        const emitClose = () => handler(options.exitCode ?? 0);
        if (options.delayMs) {
          setTimeout(emitClose, options.delayMs);
        } else {
          setImmediate(emitClose);
        }
      }
    },
    kill: vi.fn(),
  };

  return child;
}

describe("compiler process runner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses shell=false when spawning GCC", async () => {
    vi.mocked(spawn).mockReturnValue(
      createMockChild({ exitCode: 0 }) as never,
    );

    const runner = createSpawnProcessRunner();
    await runner.run({
      args: ["--version"],
      cwd: process.cwd(),
    });

    expect(spawn).toHaveBeenCalledWith(
      "gcc",
      ["--version"],
      expect.objectContaining({ shell: false, windowsHide: true }),
    );
  });

  it("captures stdout and stderr separately", async () => {
    vi.mocked(spawn).mockReturnValue(
      createMockChild({
        stdout: "compiled",
        stderr: "warning",
        exitCode: 0,
      }) as never,
    );

    const runner = createSpawnProcessRunner();
    const result = await runner.run({
      args: ["-c", "ok.c"],
      cwd: process.cwd(),
    });

    expect(result.stdout).toBe("compiled");
    expect(result.stderr).toBe("warning");
    expect(result.shellUsed).toBe(false);
  });

  it("enforces stdout cap", async () => {
    vi.mocked(spawn).mockReturnValue(
      createMockChild({
        stdout: "x".repeat(300_000),
        exitCode: 0,
      }) as never,
    );

    const runner = createSpawnProcessRunner();
    const result = await runner.run({
      args: ["-c", "ok.c"],
      cwd: process.cwd(),
      maxStdoutBytes: 1024,
    });

    expect(result.stdoutTruncated).toBe(true);
    expect(Buffer.byteLength(result.stdout, "utf8")).toBeLessThanOrEqual(1024);
  });

  it("enforces stderr cap", async () => {
    vi.mocked(spawn).mockReturnValue(
      createMockChild({
        stderr: "e".repeat(300_000),
        exitCode: 1,
      }) as never,
    );

    const runner = createSpawnProcessRunner();
    const result = await runner.run({
      args: ["-c", "bad.c"],
      cwd: process.cwd(),
      maxStderrBytes: 2048,
    });

    expect(result.stderrTruncated).toBe(true);
    expect(Buffer.byteLength(result.stderr, "utf8")).toBeLessThanOrEqual(2048);
  });

  it("reports timeout", async () => {
    vi.mocked(spawn).mockReturnValue(
      createMockChild({ exitCode: null, delayMs: 50 }) as never,
    );

    const runner = createSpawnProcessRunner();
    const result = await runner.run({
      args: ["-c", "slow.c"],
      cwd: process.cwd(),
      timeoutMs: 10,
    });

    expect(result.timedOut).toBe(true);
  });

  it("reports spawn errors", async () => {
    vi.mocked(spawn).mockReturnValue(
      createMockChild({ error: new Error("ENOENT") }) as never,
    );

    const runner = createSpawnProcessRunner();
    const result = await runner.run({
      args: ["-c", "bad.c"],
      cwd: process.cwd(),
    });

    expect(result.spawnError).toBe(true);
  });

  it("builds trusted GCC argument arrays with standard flags", () => {
    const args = buildGccArgumentArray(["arrays.c"], getPlatformExecutableName(), []);

    expect(args.slice(0, BASE_GCC_FLAGS.length)).toEqual([...BASE_GCC_FLAGS]);
    expect(args).toContain("-std=c17");
    expect(args).toContain("-Wall");
    expect(args).toContain("-Wextra");
    expect(args).toContain("-Wpedantic");
    expect(args).toContain("-fdiagnostics-color=never");
    expect(args).toContain("arrays.c");
    expect(args).toContain("-o");
    expect(args.at(-1)).toBe(getPlatformExecutableName());
  });
});
