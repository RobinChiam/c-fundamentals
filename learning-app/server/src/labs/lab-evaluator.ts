import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type {
  LabAttemptOutcome,
  LabEvaluationResponse,
  LabTestResult,
} from "@learning-app/shared";
import { BASE_GCC_FLAGS } from "../compiler/compiler-limits.js";
import {
  parseGccDiagnostics,
  sanitizeCompilerOutput,
} from "../compiler/compiler-diagnostics.js";
import { PayloadTooLargeError } from "../compiler/compiler-errors.js";
import { MAX_FILE_BYTES } from "../compiler/compiler-limits.js";
import type { DockerProcessRunner } from "../runner/docker-process.js";
import { createDockerProcessRunner } from "../runner/docker-process.js";
import {
  buildCompileDockerArgs,
  buildExecuteDockerArgs,
} from "../runner/docker-runtime.js";
import { probeRunnerStatus } from "../runner/runner-status.js";
import { RunnerUnavailableError } from "../runner/runner-errors.js";
import {
  COMPILE_STAGE_TIMEOUT_MS,
  EXECUTION_TIMEOUT_MS,
  LAB_CONTAINER_PREFIX,
  MAX_STDERR_BYTES,
  MAX_STDOUT_BYTES,
  SANDBOX_EXECUTABLE_NAME,
  TEMP_LAB_WORKSPACE_PREFIX,
} from "../runner/runner-config.js";
import {
  makeSandboxWorkspaceAccessible,
  writeSandboxWorkspaceFile,
} from "../runner/sandbox-workspace.js";
import { LabIntegrityError } from "./lab-errors.js";
import type { LabDefinition } from "./lab-types.js";
import { generateProtocolToken, parseProtocolResults } from "./test-protocol.js";

export interface LabEvaluationInput {
  lab: LabDefinition;
  submissionContent: string;
}

export interface LabEvaluator {
  evaluate(input: LabEvaluationInput): Promise<LabEvaluationResponse>;
}

export interface LabEvaluatorOptions {
  dockerRunner?: DockerProcessRunner;
  generateProtocolToken?: () => string;
}

const LEARNER_SOURCE_NAMES = new Set(["submission.c"]);
const TRUSTED_SOURCE_NAMES = new Set(["__lab_tests.c"]);

function byteLength(content: string): number {
  return Buffer.byteLength(content, "utf8");
}

function assertSubmissionSize(content: string): void {
  if (byteLength(content) > MAX_FILE_BYTES) {
    throw new PayloadTooLargeError(
      `Lab submission exceeds maximum size of ${MAX_FILE_BYTES} bytes`,
    );
  }
}

function buildTestResults(
  lab: LabDefinition,
  protocolResults: Map<string, boolean>,
): LabTestResult[] {
  const allTests = [...lab.publicTests, ...lab.hiddenTests];
  return allTests.map((test) => ({
    id: test.id,
    title: test.title,
    visibility: test.visibility,
    passed: protocolResults.get(test.id) === true,
  }));
}

function classifyCompileDiagnostics(
  stderr: string,
  workspaceDir: string,
): {
  learnerDiagnostics: LabEvaluationResponse["compileDiagnostics"];
  harnessOnlyFailure: boolean;
} {
  const fileNameToId = new Map([["submission.c", "submission"]]);
  const diagnostics = parseGccDiagnostics(
    sanitizeCompilerOutput(stderr, workspaceDir),
    { fileNameToId },
  );

  const learnerDiagnostics = diagnostics
    .filter((entry) => {
      const fileName = entry.fileName;
      return (
        fileName !== undefined &&
        LEARNER_SOURCE_NAMES.has(fileName) &&
        entry.line !== undefined &&
        entry.column !== undefined
      );
    })
    .map((entry) => ({
      severity: entry.severity,
      fileName: entry.fileName!,
      line: entry.line!,
      column: entry.column!,
      message: entry.message,
      ...(entry.fileId ? { fileId: entry.fileId } : {}),
      ...(entry.option ? { option: entry.option } : {}),
    }));
  const harnessDiagnostics = diagnostics.filter(
    (entry) => entry.fileName && TRUSTED_SOURCE_NAMES.has(entry.fileName),
  );

  const harnessOnlyFailure =
    diagnostics.length > 0 &&
    learnerDiagnostics.length === 0 &&
    harnessDiagnostics.length > 0;

  return { learnerDiagnostics, harnessOnlyFailure };
}

function determineOutcome(
  testResults: LabTestResult[],
  executionOutcome:
    | "success"
    | "runtime_error"
    | "timeout"
    | "output_limit",
): LabAttemptOutcome {
  if (executionOutcome === "timeout") {
    return "timeout";
  }
  if (executionOutcome === "output_limit") {
    return "output_limit";
  }
  if (executionOutcome === "runtime_error") {
    return "runtime_error";
  }

  const allPassed = testResults.every((result) => result.passed);
  return allPassed ? "passed" : "failed";
}

async function writeEvaluationWorkspace(
  workspaceDir: string,
  submissionFileName: string,
  submissionContent: string,
  harnessFileName: string,
  harnessContent: string,
): Promise<void> {
  await writeSandboxWorkspaceFile(
    path.join(workspaceDir, submissionFileName),
    submissionContent,
  );
  await writeSandboxWorkspaceFile(
    path.join(workspaceDir, harnessFileName),
    harnessContent,
  );
  await makeSandboxWorkspaceAccessible(workspaceDir);
}

export function createLabEvaluator(
  options: LabEvaluatorOptions = {},
): LabEvaluator {
  const dockerRunner = options.dockerRunner ?? createDockerProcessRunner();
  const createToken =
    options.generateProtocolToken ?? generateProtocolToken;

  return {
    async evaluate(input: LabEvaluationInput): Promise<LabEvaluationResponse> {
      const { lab } = input;
      assertSubmissionSize(input.submissionContent);

      const status = await probeRunnerStatus({ dockerRunner });
      if (!status.available) {
        throw new RunnerUnavailableError();
      }

      const submissionStarter = lab.starterFiles.find(
        (file) => file.id === lab.evaluation.submissionFileId,
      );
      if (!submissionStarter) {
        throw new LabIntegrityError(
          `Lab ${lab.id} is missing submission starter file`,
        );
      }

      const protocolToken = createToken();
      const harnessContent = lab.evaluation.buildHarness(protocolToken);
      const workspaceDir = await mkdtemp(
        path.join(os.tmpdir(), TEMP_LAB_WORKSPACE_PREFIX),
      );
      const compileContainerName = `${LAB_CONTAINER_PREFIX}${randomUUID()}`;
      const runContainerName = `${LAB_CONTAINER_PREFIX}${randomUUID()}`;

      try {
        await writeEvaluationWorkspace(
          workspaceDir,
          submissionStarter.name,
          input.submissionContent,
          lab.evaluation.harnessFileName,
          harnessContent,
        );

        const gccArgs = [
          ...BASE_GCC_FLAGS,
          submissionStarter.name,
          lab.evaluation.harnessFileName,
          "-o",
          SANDBOX_EXECUTABLE_NAME,
        ];

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

        if (compileResult.timedOut) {
          return {
            outcome: "timeout",
            passedTests: 0,
            totalTests: lab.publicTests.length + lab.hiddenTests.length,
            testResults: buildTestResults(lab, new Map()),
            compileDiagnostics: [],
            attemptPersisted: false,
          };
        }

        if (compileResult.exitCode !== 0 || compileResult.spawnError) {
          const { learnerDiagnostics, harnessOnlyFailure } =
            classifyCompileDiagnostics(compileResult.stderr, workspaceDir);

          if (harnessOnlyFailure) {
            throw new LabIntegrityError(
              `Lab ${lab.id} harness failed to compile`,
            );
          }

          return {
            outcome: "compile_error",
            passedTests: 0,
            totalTests: lab.publicTests.length + lab.hiddenTests.length,
            testResults: buildTestResults(lab, new Map()),
            compileDiagnostics: learnerDiagnostics,
            attemptPersisted: false,
          };
        }

        const executeResult = await dockerRunner.run({
          args: buildExecuteDockerArgs({
            containerName: runContainerName,
            hostWorkspacePath: workspaceDir,
          }),
          timeoutMs: EXECUTION_TIMEOUT_MS,
          maxStdoutBytes: MAX_STDOUT_BYTES,
          maxStderrBytes: MAX_STDERR_BYTES,
          containerName: runContainerName,
          killOnOutputLimit: true,
        });

        const protocolResults = parseProtocolResults(
          executeResult.stdout,
          protocolToken,
        );
        const testResults = buildTestResults(lab, protocolResults);

        if (executeResult.timedOut) {
          return {
            outcome: "timeout",
            passedTests: testResults.filter((result) => result.passed).length,
            totalTests: testResults.length,
            testResults,
            compileDiagnostics: [],
            attemptPersisted: false,
          };
        }

        if (executeResult.outputLimitExceeded) {
          return {
            outcome: "output_limit",
            passedTests: testResults.filter((result) => result.passed).length,
            totalTests: testResults.length,
            testResults,
            compileDiagnostics: [],
            attemptPersisted: false,
          };
        }

        const executionOutcome =
          executeResult.exitCode === 0 && !executeResult.spawnError
            ? "success"
            : "runtime_error";

        return {
          outcome: determineOutcome(testResults, executionOutcome),
          passedTests: testResults.filter((result) => result.passed).length,
          totalTests: testResults.length,
          testResults,
          compileDiagnostics: [],
          attemptPersisted: false,
        };
      } finally {
        try {
          await dockerRunner.killContainer(compileContainerName);
        } catch {
          // Ignore cleanup failures.
        }
        try {
          await dockerRunner.removeContainer(compileContainerName);
        } catch {
          // Ignore cleanup failures.
        }
        try {
          await dockerRunner.killContainer(runContainerName);
        } catch {
          // Ignore cleanup failures.
        }
        try {
          await dockerRunner.removeContainer(runContainerName);
        } catch {
          // Ignore cleanup failures.
        }
        await rm(workspaceDir, { recursive: true, force: true });
      }
    },
  };
}
