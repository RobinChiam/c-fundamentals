import { useCallback, useEffect, useState } from "react";
import type {
  CompileResponse,
  CompilerStatus,
  ExecutionResult,
  RunResponse,
  RunnerStatus,
} from "@learning-app/shared";
import {
  CompilerApiError,
  buildCompileRequestFromWorkspace,
  compileLesson,
  getCompilerStatus,
} from "../api/compiler-api";
import {
  RunnerApiError,
  getRunnerStatus,
  runLesson,
} from "../api/runner-api";
import type { LessonWorkspace } from "../workspace/workspace-types";
import { CompilerDiagnostics } from "../compiler/CompilerDiagnostics";
import { CompilerOutput } from "../compiler/CompilerOutput";
import { ProgramInput } from "./ProgramInput";
import { RuntimeTerminal } from "./RuntimeTerminal";

type CompileUiState =
  | "idle"
  | "compiling"
  | "success"
  | "failed"
  | "timeout"
  | "unavailable";

type RunUiState =
  | "idle"
  | "running"
  | "success"
  | "build_failed"
  | "runtime_error"
  | "timeout"
  | "output_limit"
  | "unavailable";

interface RunPanelProps {
  lessonId: string;
  workspace: LessonWorkspace;
}

function resolveCompileUiState(
  compileState: CompileUiState,
  status: CompilerStatus | null,
): CompileUiState {
  if (status && !status.available) {
    return "unavailable";
  }
  return compileState;
}

function resolveRunUiState(
  runState: RunUiState,
  runnerStatus: RunnerStatus | null,
): RunUiState {
  if (runnerStatus && !runnerStatus.available) {
    return "unavailable";
  }
  return runState;
}

function compileStatusLabel(state: CompileUiState): string {
  switch (state) {
    case "compiling":
      return "Compiling…";
    case "success":
      return "Build successful";
    case "failed":
      return "Build failed";
    case "timeout":
      return "Compilation timed out";
    case "unavailable":
      return "GCC unavailable";
    default:
      return "Ready to compile";
  }
}

function runStatusLabel(state: RunUiState): string {
  switch (state) {
    case "running":
      return "Running…";
    case "success":
      return "Program finished";
    case "build_failed":
      return "Build failed";
    case "runtime_error":
      return "Runtime error";
    case "timeout":
      return "Timed out";
    case "output_limit":
      return "Output limit exceeded";
    case "unavailable":
      return "Runner unavailable";
    default:
      return "Ready";
  }
}

function runnerSetupMessage(status: RunnerStatus | null): string | null {
  if (!status || status.available) {
    return null;
  }

  switch (status.reason) {
    case "runtime_missing":
      return "Docker CLI was not detected. Install Docker to enable Run.";
    case "daemon_unavailable":
      return "Docker is installed but the daemon is not running.";
    case "image_missing":
      return `Pull the runner image before using Run: docker pull ${status.image}`;
    default:
      return "Program runner is unavailable.";
  }
}

function mapRunResponseToUiState(response: RunResponse): RunUiState {
  if (response.compile.outcome !== "success") {
    return "build_failed";
  }

  switch (response.execution?.outcome) {
    case "success":
      return "success";
    case "runtime_error":
      return "runtime_error";
    case "timeout":
      return "timeout";
    case "output_limit":
      return "output_limit";
    default:
      return "idle";
  }
}

export function RunPanel({ lessonId, workspace }: RunPanelProps) {
  const [compilerStatus, setCompilerStatus] = useState<CompilerStatus | null>(null);
  const [runnerStatus, setRunnerStatus] = useState<RunnerStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [compileState, setCompileState] = useState<CompileUiState>("idle");
  const [runState, setRunState] = useState<RunUiState>("idle");
  const [compileResult, setCompileResult] = useState<CompileResponse | null>(null);
  const [runResult, setRunResult] = useState<RunResponse | null>(null);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [stdin, setStdin] = useState("");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [compiler, runner] = await Promise.all([
          getCompilerStatus(),
          getRunnerStatus(),
        ]);
        if (!cancelled) {
          setCompilerStatus(compiler);
          setRunnerStatus(runner);
          setStatusError(null);
          if (!compiler.available) {
            setCompileState("unavailable");
          }
          if (!runner.available) {
            setRunState("unavailable");
          }
        }
      } catch {
        if (!cancelled) {
          setStatusError("Unable to check compiler or runner status.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const compileUiState = resolveCompileUiState(compileState, compilerStatus);
  const runUiState = resolveRunUiState(runState, runnerStatus);
  const isCompiling = compileState === "compiling";
  const isRunning = runState === "running";
  const compileDisabled = isCompiling || isRunning || compileUiState === "unavailable";
  const runDisabled = isRunning || isCompiling || runUiState === "unavailable";

  const handleCompile = useCallback(async () => {
    if (compileDisabled) {
      return;
    }

    setCompileState("compiling");
    setCompileError(null);

    try {
      const response = await compileLesson(
        lessonId,
        buildCompileRequestFromWorkspace(workspace.files),
      );
      setCompileResult(response);

      if (response.outcome === "success") {
        setCompileState("success");
      } else if (response.outcome === "timeout") {
        setCompileState("timeout");
      } else {
        setCompileState("failed");
      }
    } catch (error) {
      if (error instanceof CompilerApiError && error.status === 503) {
        setCompileState("unavailable");
        setCompilerStatus((current) =>
          current ? { ...current, available: false, version: null } : current,
        );
        setCompileError("GCC is not available on this machine.");
        return;
      }

      setCompileState("failed");
      setCompileError(
        error instanceof Error ? error.message : "Compilation request failed",
      );
    }
  }, [compileDisabled, lessonId, workspace.files]);

  const handleRun = useCallback(async () => {
    if (runDisabled) {
      return;
    }

    setRunState("running");
    setRunError(null);
    setRunResult(null);
    setExecutionResult(null);

    const requestFiles = buildCompileRequestFromWorkspace(workspace.files).files;

    try {
      const response = await runLesson(lessonId, requestFiles, stdin);
      setRunResult(response);
      setCompileResult(response.compile);
      setExecutionResult(response.execution);
      setRunState(mapRunResponseToUiState(response));

      if (response.compile.outcome !== "success") {
        setCompileState("failed");
      } else if (response.compile.outcome === "success") {
        setCompileState("success");
      }
    } catch (error) {
      if (error instanceof RunnerApiError && error.status === 503) {
        setRunState("unavailable");
        setRunnerStatus((current) =>
          current ? { ...current, available: false } : current,
        );
        setRunError("Program runner is not available.");
        return;
      }

      setRunState("build_failed");
      setRunError(error instanceof Error ? error.message : "Run request failed");
    }
  }, [lessonId, runDisabled, stdin, workspace.files]);

  const setupMessage = runnerSetupMessage(runnerStatus);
  const activeCompileResult = runResult?.compile ?? compileResult;

  return (
    <section
      aria-label="Run panel"
      className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
    >
      <ProgramInput value={stdin} onChange={setStdin} disabled={isRunning} />

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Build and run</h3>
          <p className="text-sm text-slate-600" aria-live="polite">
            Compile: {compileStatusLabel(compileUiState)}
          </p>
          <p className="text-sm text-slate-600" aria-live="polite">
            Run: {runStatusLabel(runUiState)}
          </p>
          {compilerStatus?.available && compilerStatus.version ? (
            <p className="text-xs text-slate-500">{compilerStatus.version}</p>
          ) : null}
          {runnerStatus?.available ? (
            <p className="text-xs text-slate-500">Runner image: {runnerStatus.image}</p>
          ) : null}
          {statusError ? (
            <p className="text-xs text-amber-700">{statusError}</p>
          ) : null}
          {compileUiState === "unavailable" ? (
            <p className="text-xs text-amber-700">
              Local GCC was not detected. Editing remains available, but compile is
              disabled.
            </p>
          ) : null}
          {runUiState === "unavailable" && setupMessage ? (
            <p className="text-xs text-amber-700">{setupMessage}</p>
          ) : null}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              void handleCompile();
            }}
            disabled={compileDisabled}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCompiling ? "Compiling…" : "Compile"}
          </button>
          <button
            type="button"
            onClick={() => {
              void handleRun();
            }}
            disabled={runDisabled}
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRunning ? "Running…" : "Run"}
          </button>
        </div>
      </div>

      {compileError ? (
        <p className="mt-3 text-sm text-red-700">{compileError}</p>
      ) : null}
      {runError ? <p className="mt-3 text-sm text-red-700">{runError}</p> : null}

      {activeCompileResult ? (
        <div className="mt-4 space-y-4">
          <CompilerDiagnostics diagnostics={activeCompileResult.diagnostics} />
          <CompilerOutput
            stdout={activeCompileResult.stdout}
            stderr={activeCompileResult.stderr}
            stdoutTruncated={activeCompileResult.stdoutTruncated}
            stderrTruncated={activeCompileResult.stderrTruncated}
          />
        </div>
      ) : null}

      <RuntimeTerminal execution={executionResult} />
    </section>
  );
}
