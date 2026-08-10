import { spawn } from "node:child_process";
import {
  BASE_GCC_FLAGS,
  COMPILE_TIMEOUT_MS,
  GCC_COMMAND,
  MAX_STDERR_BYTES,
  MAX_STDOUT_BYTES,
} from "./compiler-limits.js";

export interface ProcessRunOptions {
  command?: string;
  args: string[];
  cwd: string;
  timeoutMs?: number;
  maxStdoutBytes?: number;
  maxStderrBytes?: number;
}

export interface ProcessRunResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  stdoutTruncated: boolean;
  stderrTruncated: boolean;
  timedOut: boolean;
  spawnError: boolean;
  shellUsed: boolean;
}

export interface ProcessRunner {
  run(options: ProcessRunOptions): Promise<ProcessRunResult>;
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

export function createSpawnProcessRunner(): ProcessRunner {
  return {
    run(options: ProcessRunOptions): Promise<ProcessRunResult> {
      const command = options.command ?? GCC_COMMAND;
      const timeoutMs = options.timeoutMs ?? COMPILE_TIMEOUT_MS;
      const maxStdoutBytes = options.maxStdoutBytes ?? MAX_STDOUT_BYTES;
      const maxStderrBytes = options.maxStderrBytes ?? MAX_STDERR_BYTES;

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

        const finish = (result: ProcessRunResult): void => {
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
        }, timeoutMs);

        child.stdout?.on("data", (chunk: Buffer) => {
          const result = appendChunk(
            stdoutChunks,
            chunk,
            stdoutBytes,
            maxStdoutBytes,
          );
          stdoutBytes = result.totalBytes;
          stdoutTruncated ||= result.truncated;
        });

        child.stderr?.on("data", (chunk: Buffer) => {
          const result = appendChunk(
            stderrChunks,
            chunk,
            stderrBytes,
            maxStderrBytes,
          );
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
            shellUsed: false,
          });
        });
      });
    },
  };
}

export function buildGccArgumentArray(
  sourceFileNames: string[],
  outputFileName: string,
  linkFlags: string[],
): string[] {
  return [
    ...BASE_GCC_FLAGS,
    ...sourceFileNames,
    "-o",
    outputFileName,
    ...linkFlags,
  ];
}

export function getPlatformExecutableName(): string {
  return process.platform === "win32" ? "program.exe" : "program";
}
