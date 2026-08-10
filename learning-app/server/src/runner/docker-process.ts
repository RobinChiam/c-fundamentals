import { spawn } from "node:child_process";
import {
  DOCKER_COMMAND,
  EXECUTION_TIMEOUT_MS,
  MAX_STDERR_BYTES,
  MAX_STDOUT_BYTES,
  STATUS_PROBE_TIMEOUT_MS,
} from "./runner-config.js";

export interface DockerRunOptions {
  args: string[];
  stdin?: string;
  timeoutMs?: number;
  maxStdoutBytes?: number;
  maxStderrBytes?: number;
  containerName?: string;
  killOnOutputLimit?: boolean;
}

export interface DockerRunResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  stdoutTruncated: boolean;
  stderrTruncated: boolean;
  timedOut: boolean;
  spawnError: boolean;
  outputLimitExceeded: boolean;
  shellUsed: boolean;
}

export interface DockerProcessRunner {
  run(options: DockerRunOptions): Promise<DockerRunResult>;
  killContainer(name: string): Promise<void>;
  removeContainer(name: string): Promise<void>;
}

function decodeChunk(chunks: Buffer[], totalBytes: number): string {
  if (chunks.length === 0) {
    return "";
  }
  return Buffer.concat(chunks, totalBytes).toString("utf8");
}

function appendChunk(
  chunks: Buffer[],
  chunk: Buffer,
  totalBytes: number,
  maxBytes: number,
): { totalBytes: number; truncated: boolean } {
  if (totalBytes >= maxBytes) {
    return { totalBytes, truncated: true };
  }

  const remaining = maxBytes - totalBytes;
  const slice = chunk.length > remaining ? chunk.subarray(0, remaining) : chunk;
  chunks.push(slice);
  return {
    totalBytes: totalBytes + slice.length,
    truncated: chunk.length > remaining,
  };
}

export function createDockerProcessRunner(
  dockerCommand = DOCKER_COMMAND,
): DockerProcessRunner {
  async function terminateContainer(name: string): Promise<void> {
    try {
      await invokeDocker(["kill", name]);
    } catch {
      // Ignore cleanup failures.
    }
    try {
      await invokeDocker(["rm", "-f", name]);
    } catch {
      // Ignore cleanup failures.
    }
  }

  async function invokeDocker(args: string[]): Promise<DockerRunResult> {
    return new Promise((resolve) => {
      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];
      let stdoutBytes = 0;
      let stderrBytes = 0;
      let stdoutTruncated = false;
      let stderrTruncated = false;
      let timedOut = false;
      let spawnError = false;
      let outputLimitExceeded = false;
      let settled = false;

      const child = spawn(dockerCommand, args, {
        shell: false,
        windowsHide: true,
      });

      const finish = (result: DockerRunResult): void => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeoutHandle);
        resolve(result);
      };

      const timeoutHandle = setTimeout(() => {
        timedOut = true;
        child.kill("SIGKILL");
      }, STATUS_PROBE_TIMEOUT_MS);

      child.stdout?.on("data", (chunk: Buffer) => {
        const result = appendChunk(stdoutChunks, chunk, stdoutBytes, 4096);
        stdoutBytes = result.totalBytes;
        stdoutTruncated ||= result.truncated;
      });

      child.stderr?.on("data", (chunk: Buffer) => {
        const result = appendChunk(stderrChunks, chunk, stderrBytes, 4096);
        stderrBytes = result.totalBytes;
        stderrTruncated ||= result.truncated;
      });

      child.on("error", () => {
        spawnError = true;
        finish({
          exitCode: null,
          stdout: decodeChunk(stdoutChunks, stdoutBytes),
          stderr: decodeChunk(stderrChunks, stderrBytes),
          stdoutTruncated,
          stderrTruncated,
          timedOut,
          spawnError,
          outputLimitExceeded,
          shellUsed: false,
        });
      });

      child.on("close", (exitCode) => {
        finish({
          exitCode,
          stdout: decodeChunk(stdoutChunks, stdoutBytes),
          stderr: decodeChunk(stderrChunks, stderrBytes),
          stdoutTruncated,
          stderrTruncated,
          timedOut,
          spawnError,
          outputLimitExceeded,
          shellUsed: false,
        });
      });
    });
  }

  return {
    run(options: DockerRunOptions): Promise<DockerRunResult> {
      const timeoutMs = options.timeoutMs ?? EXECUTION_TIMEOUT_MS;
      const maxStdoutBytes = options.maxStdoutBytes ?? MAX_STDOUT_BYTES;
      const maxStderrBytes = options.maxStderrBytes ?? MAX_STDERR_BYTES;
      const killOnOutputLimit = options.killOnOutputLimit ?? false;

      return new Promise((resolve) => {
        const stdoutChunks: Buffer[] = [];
        const stderrChunks: Buffer[] = [];
        let stdoutBytes = 0;
        let stderrBytes = 0;
        let stdoutTruncated = false;
        let stderrTruncated = false;
        let timedOut = false;
        let spawnError = false;
        let outputLimitExceeded = false;
        let settled = false;
        let containerTermination: Promise<void> | null = null;

        const scheduleContainerTermination = (): void => {
          if (!options.containerName || containerTermination) {
            return;
          }
          containerTermination = terminateContainer(options.containerName);
        };

        const child = spawn(dockerCommand, options.args, {
          shell: false,
          windowsHide: true,
        });

        const finish = async (result: DockerRunResult): Promise<void> => {
          if (settled) {
            return;
          }
          settled = true;
          clearTimeout(timeoutHandle);

          if (
            options.containerName &&
            (result.timedOut || result.outputLimitExceeded)
          ) {
            scheduleContainerTermination();
            await containerTermination;
          }

          resolve(result);
        };

        const timeoutHandle = setTimeout(() => {
          timedOut = true;
          child.kill("SIGKILL");
          scheduleContainerTermination();
        }, timeoutMs);

        if (options.stdin !== undefined && child.stdin) {
          child.stdin.write(options.stdin);
          child.stdin.end();
        }

        child.stdout?.on("data", (chunk: Buffer) => {
          const result = appendChunk(
            stdoutChunks,
            chunk,
            stdoutBytes,
            maxStdoutBytes,
          );
          stdoutBytes = result.totalBytes;
          if (result.truncated) {
            stdoutTruncated = true;
            if (killOnOutputLimit) {
              outputLimitExceeded = true;
              child.kill("SIGKILL");
              scheduleContainerTermination();
            }
          }
        });

        child.stderr?.on("data", (chunk: Buffer) => {
          const result = appendChunk(
            stderrChunks,
            chunk,
            stderrBytes,
            maxStderrBytes,
          );
          stderrBytes = result.totalBytes;
          if (result.truncated) {
            stderrTruncated = true;
            if (killOnOutputLimit) {
              outputLimitExceeded = true;
              child.kill("SIGKILL");
              scheduleContainerTermination();
            }
          }
        });

        child.on("error", () => {
          spawnError = true;
          void finish({
            exitCode: null,
            stdout: decodeChunk(stdoutChunks, stdoutBytes),
            stderr: decodeChunk(stderrChunks, stderrBytes),
            stdoutTruncated,
            stderrTruncated,
            timedOut,
            spawnError,
            outputLimitExceeded,
            shellUsed: false,
          });
        });

        child.on("close", (exitCode) => {
          void finish({
            exitCode,
            stdout: decodeChunk(stdoutChunks, stdoutBytes),
            stderr: decodeChunk(stderrChunks, stderrBytes),
            stdoutTruncated,
            stderrTruncated,
            timedOut,
            spawnError,
            outputLimitExceeded,
            shellUsed: false,
          });
        });
      });
    },

    async killContainer(name: string): Promise<void> {
      await invokeDocker(["kill", name]);
    },

    async removeContainer(name: string): Promise<void> {
      await invokeDocker(["rm", "-f", name]);
    },
  };
}
