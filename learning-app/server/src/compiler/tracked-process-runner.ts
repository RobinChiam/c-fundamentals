import type { ChildProcess } from "node:child_process";
import type { ProcessRunner } from "../compiler/compiler-process.js";

export interface TrackedProcessRunner extends ProcessRunner {
  terminateActiveProcesses(): Promise<void>;
}

export function createTrackedProcessRunner(): TrackedProcessRunner {
  const activeChildren = new Set<ChildProcess>();

  return {
    async run(options) {
      const { spawn } = await import("node:child_process");
      const command = options.command ?? "gcc";

      return new Promise((resolve) => {
        const stdoutChunks: Buffer[] = [];
        const stderrChunks: Buffer[] = [];
        let stdoutBytes = 0;
        let stderrBytes = 0;
        let stdoutTruncated = false;
        let stderrTruncated = false;
        let timedOut = false;
        let spawnError = false;
        let settled = false;

        const child = spawn(command, options.args, {
          cwd: options.cwd,
          shell: false,
          windowsHide: true,
        });
        activeChildren.add(child);

        const finish = (result: Awaited<ReturnType<ProcessRunner["run"]>>): void => {
          if (settled) {
            return;
          }
          settled = true;
          activeChildren.delete(child);
          clearTimeout(timeoutHandle);
          resolve(result);
        };

        const timeoutMs = options.timeoutMs ?? 30_000;
        const maxStdoutBytes = options.maxStdoutBytes ?? 256 * 1024;
        const maxStderrBytes = options.maxStderrBytes ?? 256 * 1024;

        const timeoutHandle = setTimeout(() => {
          timedOut = true;
          child.kill("SIGKILL");
        }, timeoutMs);

        child.stdout?.on("data", (chunk: Buffer) => {
          const remaining = maxStdoutBytes - stdoutBytes;
          if (remaining <= 0) {
            stdoutTruncated = true;
            return;
          }
          const slice =
            chunk.length > remaining ? chunk.subarray(0, remaining) : chunk;
          stdoutChunks.push(slice);
          stdoutBytes += slice.length;
          stdoutTruncated ||= chunk.length > remaining;
        });

        child.stderr?.on("data", (chunk: Buffer) => {
          const remaining = maxStderrBytes - stderrBytes;
          if (remaining <= 0) {
            stderrTruncated = true;
            return;
          }
          const slice =
            chunk.length > remaining ? chunk.subarray(0, remaining) : chunk;
          stderrChunks.push(slice);
          stderrBytes += slice.length;
          stderrTruncated ||= chunk.length > remaining;
        });

        child.on("error", () => {
          spawnError = true;
          finish({
            exitCode: null,
            stdout: Buffer.concat(stdoutChunks, stdoutBytes).toString("utf8"),
            stderr: Buffer.concat(stderrChunks, stderrBytes).toString("utf8"),
            stdoutTruncated,
            stderrTruncated,
            timedOut,
            spawnError,
            shellUsed: false,
          });
        });

        child.on("close", (exitCode) => {
          finish({
            exitCode,
            stdout: Buffer.concat(stdoutChunks, stdoutBytes).toString("utf8"),
            stderr: Buffer.concat(stderrChunks, stderrBytes).toString("utf8"),
            stdoutTruncated,
            stderrTruncated,
            timedOut,
            spawnError,
            shellUsed: false,
          });
        });
      });
    },

    async terminateActiveProcesses(): Promise<void> {
      for (const child of activeChildren) {
        child.kill("SIGKILL");
      }
      activeChildren.clear();
    },
  };
}
