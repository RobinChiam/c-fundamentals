import { describe, expect, it, vi, beforeEach } from "vitest";
import { spawn } from "node:child_process";
import { createDockerProcessRunner } from "./docker-process.js";

vi.mock("node:child_process", () => ({
  spawn: vi.fn(),
}));

function createMockChild(options: {
  stdout?: string;
  stderr?: string;
  exitCode?: number | null;
  error?: Error;
  delayMs?: number;
  closeOnKill?: boolean;
}) {
  const handlers: Record<string, Array<(value?: unknown) => void>> = {};
  const child = {
    stdin: {
      write: vi.fn(),
      end: vi.fn(),
    },
    stdout: {
      on(event: string, handler: (chunk: Buffer) => void) {
        if (event === "data" && options.stdout !== undefined) {
          setImmediate(() => handler(Buffer.from(options.stdout ?? "")));
        }
      },
    },
    stderr: {
      on(event: string, handler: (chunk: Buffer) => void) {
        if (event === "data" && options.stderr !== undefined) {
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
        if (options.closeOnKill) {
          return;
        }

        const emitClose = () => handler(options.exitCode ?? 0);
        if (options.delayMs) {
          setTimeout(emitClose, options.delayMs);
        } else {
          setImmediate(emitClose);
        }
      }
    },
    kill: vi.fn(() => {
      if (options.closeOnKill) {
        for (const handler of handlers.close ?? []) {
          handler(options.exitCode ?? null);
        }
      }
    }),
  };

  return child;
}

describe("docker process runner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses shell=false when spawning Docker", async () => {
    vi.mocked(spawn).mockReturnValue(
      createMockChild({ exitCode: 0 }) as never,
    );

    const runner = createDockerProcessRunner();
    await runner.run({ args: ["run", "hello"] });

    expect(spawn).toHaveBeenCalledWith(
      "docker",
      ["run", "hello"],
      expect.objectContaining({ shell: false, windowsHide: true }),
    );
  });

  it("does not invoke Docker through a shell command string", async () => {
    vi.mocked(spawn).mockReturnValue(
      createMockChild({ exitCode: 0 }) as never,
    );

    const runner = createDockerProcessRunner();
    await runner.run({ args: ["run", "hello"] });

    const [command, args, options] = vi.mocked(spawn).mock.calls[0] ?? [];
    expect(command).toBe("docker");
    expect(Array.isArray(args)).toBe(true);
    expect(options).toEqual(expect.objectContaining({ shell: false }));
  });

  it("invokes docker kill and rm when timed out", async () => {
    const containerName = "cfund-run-timeout";
    vi.mocked(spawn).mockImplementation((_command, args) => {
      const subcommand = args?.[0];
      if (subcommand === "kill" || subcommand === "rm") {
        return createMockChild({ exitCode: 0 }) as never;
      }
      return createMockChild({ closeOnKill: true, exitCode: null }) as never;
    });

    const runner = createDockerProcessRunner();
    const result = await runner.run({
      args: ["run", "--name", containerName],
      containerName,
      timeoutMs: 10,
    });

    expect(result.timedOut).toBe(true);
    expect(spawn).toHaveBeenCalledWith(
      "docker",
      ["kill", containerName],
      expect.objectContaining({ shell: false }),
    );
    expect(spawn).toHaveBeenCalledWith(
      "docker",
      ["rm", "-f", containerName],
      expect.objectContaining({ shell: false }),
    );
  });

  it("invokes docker kill and rm when output limit is exceeded", async () => {
    const containerName = "cfund-run-output-limit";
    vi.mocked(spawn).mockImplementation((_command, args) => {
      const subcommand = args?.[0];
      if (subcommand === "kill" || subcommand === "rm") {
        return createMockChild({ exitCode: 0 }) as never;
      }
      return createMockChild({
        stdout: "x".repeat(200),
        closeOnKill: true,
        exitCode: null,
      }) as never;
    });

    const runner = createDockerProcessRunner();
    const result = await runner.run({
      args: ["run", "--name", containerName],
      containerName,
      maxStdoutBytes: 10,
      killOnOutputLimit: true,
    });

    expect(result.outputLimitExceeded).toBe(true);
    expect(result.stdoutTruncated).toBe(true);
    expect(spawn).toHaveBeenCalledWith(
      "docker",
      ["kill", containerName],
      expect.objectContaining({ shell: false }),
    );
    expect(spawn).toHaveBeenCalledWith(
      "docker",
      ["rm", "-f", containerName],
      expect.objectContaining({ shell: false }),
    );
  });
});
