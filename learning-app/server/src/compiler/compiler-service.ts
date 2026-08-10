import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type {
  CompileRequest,
  CompileResponse,
  CompilerStatus,
} from "@learning-app/shared";
import {
  CURRICULUM_MANIFEST,
  type ManifestLessonEntry,
} from "../curriculum/manifest.js";
import { LessonNotFoundError } from "../curriculum/curriculum-service.js";
import {
  parseGccDiagnostics,
  sanitizeCompilerOutput,
} from "./compiler-diagnostics.js";
import {
  CompileInternalError,
  CompilerUnavailableError,
} from "./compiler-errors.js";
import { COMPILE_TIMEOUT_MS, TEMP_WORKSPACE_PREFIX } from "./compiler-limits.js";
import {
  buildGccArgumentArray,
  createSpawnProcessRunner,
  getPlatformExecutableName,
  type ProcessRunner,
} from "./compiler-process.js";
import {
  buildFileNameToIdMap,
  validateCompileRequest,
  type ValidatedWorkspaceFile,
} from "./compiler-workspace.js";

const STATUS_PROBE_TIMEOUT_MS = 3_000;

export interface CompilerServiceOptions {
  manifest?: ManifestLessonEntry[];
  processRunner?: ProcessRunner;
  gccCommand?: string;
}

export interface CompilerService {
  getStatus(): Promise<CompilerStatus>;
  compileLesson(lessonId: string, request: CompileRequest): Promise<CompileResponse>;
}

async function writeWorkspaceFiles(
  workspaceDir: string,
  files: ValidatedWorkspaceFile[],
): Promise<void> {
  await Promise.all(
    files.map((file) =>
      writeFile(path.join(workspaceDir, file.name), file.content, "utf8"),
    ),
  );
}

function resolveSourceFileNames(
  lesson: ManifestLessonEntry,
): string[] {
  const filesById = new Map(lesson.files.map((file) => [file.id, file]));
  return lesson.compile.sourceFileIds.map((fileId) => {
    const manifestFile = filesById.get(fileId);
    if (!manifestFile) {
      throw new CompileInternalError(
        `Compile source file id ${fileId} is missing from lesson ${lesson.id}`,
      );
    }
    return manifestFile.name;
  });
}

export function createCompilerService(
  options: CompilerServiceOptions = {},
): CompilerService {
  const manifest = options.manifest ?? CURRICULUM_MANIFEST;
  const processRunner = options.processRunner ?? createSpawnProcessRunner();
  const gccCommand = options.gccCommand ?? "gcc";
  const lessonsById = new Map(manifest.map((lesson) => [lesson.id, lesson]));

  let cachedStatus: CompilerStatus | null = null;

  async function probeGccAvailability(force = false): Promise<CompilerStatus> {
    if (!force && cachedStatus) {
      return cachedStatus;
    }

    const result = await processRunner.run({
      command: gccCommand,
      args: ["--version"],
      cwd: os.tmpdir(),
      timeoutMs: STATUS_PROBE_TIMEOUT_MS,
      maxStdoutBytes: 4096,
      maxStderrBytes: 4096,
    });

    if (result.spawnError || result.timedOut || result.exitCode !== 0) {
      cachedStatus = {
        available: false,
        compiler: "gcc",
        version: null,
      };
      return cachedStatus;
    }

    const versionLine =
      result.stdout
        .split(/\r?\n/u)
        .map((line) => line.trim())
        .find((line) => line.length > 0) ?? null;

    cachedStatus = {
      available: true,
      compiler: "gcc",
      version: versionLine,
    };
    return cachedStatus;
  }

  return {
    async getStatus(): Promise<CompilerStatus> {
      return probeGccAvailability();
    },

    async compileLesson(
      lessonId: string,
      request: CompileRequest,
    ): Promise<CompileResponse> {
      const lesson = lessonsById.get(lessonId);
      if (!lesson) {
        throw new LessonNotFoundError(lessonId);
      }

      const status = await probeGccAvailability();
      if (!status.available) {
        throw new CompilerUnavailableError();
      }

      const validatedFiles = validateCompileRequest(lesson, request);
      const workspaceDir = await mkdtemp(
        path.join(os.tmpdir(), TEMP_WORKSPACE_PREFIX),
      );

      try {
        await writeWorkspaceFiles(workspaceDir, validatedFiles);

        const sourceFileNames = resolveSourceFileNames(lesson);
        const outputFileName = getPlatformExecutableName();
        const args = buildGccArgumentArray(
          sourceFileNames,
          outputFileName,
          lesson.compile.linkFlags,
        );

        const result = await processRunner.run({
          command: gccCommand,
          args,
          cwd: workspaceDir,
          timeoutMs: COMPILE_TIMEOUT_MS,
        });

        const sanitizedStdout = sanitizeCompilerOutput(result.stdout, workspaceDir);
        const sanitizedStderr = sanitizeCompilerOutput(result.stderr, workspaceDir);
        const diagnostics = parseGccDiagnostics(sanitizedStderr, {
          fileNameToId: buildFileNameToIdMap(lesson),
        });

        if (result.timedOut) {
          return {
            outcome: "timeout",
            exitCode: result.exitCode,
            stdout: sanitizedStdout,
            stderr: sanitizedStderr,
            stdoutTruncated: result.stdoutTruncated,
            stderrTruncated: result.stderrTruncated,
            diagnostics,
          };
        }

        if (result.spawnError) {
          throw new CompileInternalError("Failed to spawn GCC process");
        }

        const succeeded = result.exitCode === 0;
        return {
          outcome: succeeded ? "success" : "failed",
          exitCode: result.exitCode,
          stdout: sanitizedStdout,
          stderr: sanitizedStderr,
          stdoutTruncated: result.stdoutTruncated,
          stderrTruncated: result.stderrTruncated,
          diagnostics,
        };
      } finally {
        await rm(workspaceDir, { recursive: true, force: true });
      }
    },
  };
}
