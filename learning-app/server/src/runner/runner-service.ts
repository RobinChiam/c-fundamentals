import { randomUUID } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type {
  CompileResponse,
  ExecutionResult,
  RunRequest,
  RunResponse,
  RunnerStatus,
} from "@learning-app/shared";
import {
  CURRICULUM_MANIFEST,
  type ManifestLessonEntry,
} from "../curriculum/manifest.js";
import { LessonNotFoundError } from "../curriculum/curriculum-service.js";
import {
  parseGccDiagnostics,
  sanitizeCompilerOutput,
} from "../compiler/compiler-diagnostics.js";
import {
  PayloadTooLargeError,
} from "../compiler/compiler-errors.js";
import { buildGccArgumentArray } from "../compiler/compiler-process.js";
import {
  buildFileNameToIdMap,
  validateCompileRequest,
  type ValidatedWorkspaceFile,
} from "../compiler/compiler-workspace.js";
import {
  buildCompileDockerArgs,
  buildExecuteDockerArgs,
} from "./docker-runtime.js";
import type { DockerProcessRunner } from "./docker-process.js";
import { createDockerProcessRunner } from "./docker-process.js";
import {
  COMPILE_CONTAINER_PREFIX,
  COMPILE_STAGE_TIMEOUT_MS,
  CONTAINER_PROGRAM_PATH,
  EXECUTION_TIMEOUT_MS,
  MAX_STDERR_BYTES,
  MAX_STDIN_BYTES,
  MAX_STDOUT_BYTES,
  RUN_CONTAINER_PREFIX,
  SANDBOX_EXECUTABLE_NAME,
  TEMP_RUN_WORKSPACE_PREFIX,
} from "./runner-config.js";
import { RunInternalError, RunnerUnavailableError } from "./runner-errors.js";
import { probeRunnerStatus } from "./runner-status.js";

export interface RunnerServiceOptions {
  manifest?: ManifestLessonEntry[];
  dockerRunner?: DockerProcessRunner;
}

export interface RunnerService {
  getStatus(): Promise<RunnerStatus>;
  runLesson(lessonId: string, request: RunRequest): Promise<RunResponse>;
}

function byteLength(content: string): number {
  return Buffer.byteLength(content, "utf8");
}

function validateStdin(stdin: string): void {
  if (byteLength(stdin) > MAX_STDIN_BYTES) {
    throw new PayloadTooLargeError(
      `Run request stdin exceeds maximum size of ${MAX_STDIN_BYTES} bytes`,
    );
  }
}

async function writeWorkspaceFiles(
  workspaceDir: string,
  files: ValidatedWorkspaceFile[],
): Promise<void> {
  await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(workspaceDir, file.name);
      await writeFile(filePath, file.content, "utf8");
    }),
  );
}

function resolveSourceFileNames(lesson: ManifestLessonEntry): string[] {
  const filesById = new Map(lesson.files.map((file) => [file.id, file]));
  return lesson.compile.sourceFileIds.map((fileId) => {
    const manifestFile = filesById.get(fileId);
    if (!manifestFile) {
      throw new RunInternalError(
        `Run source file id ${fileId} is missing from lesson ${lesson.id}`,
      );
    }
    return manifestFile.name;
  });
}

function buildCompileResponse(
  lesson: ManifestLessonEntry,
  workspaceDir: string,
  exitCode: number | null,
  stdout: string,
  stderr: string,
  stdoutTruncated: boolean,
  stderrTruncated: boolean,
  timedOut: boolean,
): CompileResponse {
  const sanitizedStdout = sanitizeCompilerOutput(stdout, workspaceDir);
  const sanitizedStderr = sanitizeCompilerOutput(stderr, workspaceDir);
  const diagnostics = parseGccDiagnostics(sanitizedStderr, {
    fileNameToId: buildFileNameToIdMap(lesson),
  });

  if (timedOut) {
    return {
      outcome: "timeout",
      exitCode,
      stdout: sanitizedStdout,
      stderr: sanitizedStderr,
      stdoutTruncated,
      stderrTruncated,
      diagnostics,
    };
  }

  const succeeded = exitCode === 0;
  return {
    outcome: succeeded ? "success" : "failed",
    exitCode,
    stdout: sanitizedStdout,
    stderr: sanitizedStderr,
    stdoutTruncated,
    stderrTruncated,
    diagnostics,
  };
}

function buildExecutionResult(
  exitCode: number | null,
  stdout: string,
  stderr: string,
  stdoutTruncated: boolean,
  stderrTruncated: boolean,
  timedOut: boolean,
  outputLimitExceeded: boolean,
  durationMs: number,
): ExecutionResult {
  if (timedOut) {
    return {
      outcome: "timeout",
      exitCode,
      stdout,
      stderr,
      stdoutTruncated,
      stderrTruncated,
      durationMs,
    };
  }

  if (outputLimitExceeded) {
    return {
      outcome: "output_limit",
      exitCode,
      stdout,
      stderr,
      stdoutTruncated,
      stderrTruncated,
      durationMs,
    };
  }

  if (exitCode === 0) {
    return {
      outcome: "success",
      exitCode,
      stdout,
      stderr,
      stdoutTruncated,
      stderrTruncated,
      durationMs,
    };
  }

  return {
    outcome: "runtime_error",
    exitCode,
    stdout,
    stderr,
    stdoutTruncated,
    stderrTruncated,
    durationMs,
  };
}

export function createRunnerService(
  options: RunnerServiceOptions = {},
): RunnerService {
  const manifest = options.manifest ?? CURRICULUM_MANIFEST;
  const dockerRunner = options.dockerRunner ?? createDockerProcessRunner();
  const lessonsById = new Map(manifest.map((lesson) => [lesson.id, lesson]));

  return {
    async getStatus(): Promise<RunnerStatus> {
      return probeRunnerStatus({ dockerRunner });
    },

    async runLesson(lessonId: string, request: RunRequest): Promise<RunResponse> {
      const lesson = lessonsById.get(lessonId);
      if (!lesson) {
        throw new LessonNotFoundError(lessonId);
      }

      const status = await probeRunnerStatus({ dockerRunner });
      if (!status.available) {
        throw new RunnerUnavailableError();
      }

      validateStdin(request.stdin);
      const validatedFiles = validateCompileRequest(lesson, {
        files: request.files,
      });

      const workspaceDir = await mkdtemp(
        path.join(os.tmpdir(), TEMP_RUN_WORKSPACE_PREFIX),
      );

      const compileContainerName = `${COMPILE_CONTAINER_PREFIX}${randomUUID()}`;
      const runContainerName = `${RUN_CONTAINER_PREFIX}${randomUUID()}`;

      try {
        await writeWorkspaceFiles(workspaceDir, validatedFiles);

        const sourceFileNames = resolveSourceFileNames(lesson);
        const gccArgs = buildGccArgumentArray(
          sourceFileNames,
          SANDBOX_EXECUTABLE_NAME,
          lesson.compile.linkFlags,
        );

        const compileResult = await dockerRunner.run({
          args: buildCompileDockerArgs({
            containerName: compileContainerName,
            hostWorkspacePath: workspaceDir,
            gccArgs,
          }),
          timeoutMs: COMPILE_STAGE_TIMEOUT_MS,
          maxStdoutBytes: MAX_STDOUT_BYTES,
          maxStderrBytes: MAX_STDERR_BYTES,
          containerName: compileContainerName,
        });

        const compileResponse = buildCompileResponse(
          lesson,
          workspaceDir,
          compileResult.exitCode,
          compileResult.stdout,
          compileResult.stderr,
          compileResult.stdoutTruncated,
          compileResult.stderrTruncated,
          compileResult.timedOut,
        );

        if (compileResponse.outcome !== "success") {
          return {
            compile: compileResponse,
            execution: null,
          };
        }

        const startedAt = Date.now();
        const executeResult = await dockerRunner.run({
          args: buildExecuteDockerArgs({
            containerName: runContainerName,
            hostWorkspacePath: workspaceDir,
          }),
          stdin: request.stdin,
          timeoutMs: EXECUTION_TIMEOUT_MS,
          maxStdoutBytes: MAX_STDOUT_BYTES,
          maxStderrBytes: MAX_STDERR_BYTES,
          containerName: runContainerName,
          killOnOutputLimit: true,
        });
        const durationMs = Date.now() - startedAt;

        if (executeResult.spawnError) {
          throw new RunInternalError("Failed to spawn Docker execution process");
        }

        const execution = buildExecutionResult(
          executeResult.exitCode,
          executeResult.stdout,
          executeResult.stderr,
          executeResult.stdoutTruncated,
          executeResult.stderrTruncated,
          executeResult.timedOut,
          executeResult.outputLimitExceeded,
          durationMs,
        );

        return {
          compile: compileResponse,
          execution,
        };
      } finally {
        try {
          await dockerRunner.killContainer(compileContainerName);
        } catch {
          // Ignore missing container cleanup.
        }
        try {
          await dockerRunner.removeContainer(compileContainerName);
        } catch {
          // Ignore missing container cleanup.
        }
        try {
          await dockerRunner.killContainer(runContainerName);
        } catch {
          // Ignore missing container cleanup.
        }
        try {
          await dockerRunner.removeContainer(runContainerName);
        } catch {
          // Ignore missing container cleanup.
        }
        await rm(workspaceDir, { recursive: true, force: true });
      }
    },
  };
}

export { CONTAINER_PROGRAM_PATH };
