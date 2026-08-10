import { useCallback, useEffect, useState } from "react";
import type { CompileResponse, CompilerStatus } from "@learning-app/shared";
import {
  CompilerApiError,
  buildCompileRequestFromWorkspace,
  compileLesson,
  getCompilerStatus,
} from "../api/compiler-api";
import type { LessonWorkspace } from "../workspace/workspace-types";
import { CompilerDiagnostics } from "./CompilerDiagnostics";
import { CompilerOutput } from "./CompilerOutput";

type CompileUiState =
  | "idle"
  | "compiling"
  | "success"
  | "failed"
  | "timeout"
  | "unavailable";

interface CompilerPanelProps {
  lessonId: string;
  workspace: LessonWorkspace;
}

function resolveUiState(
  compileState: CompileUiState,
  status: CompilerStatus | null,
): CompileUiState {
  if (status && !status.available) {
    return "unavailable";
  }
  return compileState;
}

function statusLabel(state: CompileUiState): string {
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

export function CompilerPanel({ lessonId, workspace }: CompilerPanelProps) {
  const [status, setStatus] = useState<CompilerStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [compileState, setCompileState] = useState<CompileUiState>("idle");
  const [result, setResult] = useState<CompileResponse | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const compilerStatus = await getCompilerStatus();
        if (!cancelled) {
          setStatus(compilerStatus);
          setStatusError(null);
          if (!compilerStatus.available) {
            setCompileState("unavailable");
          }
        }
      } catch {
        if (!cancelled) {
          setStatusError("Unable to check compiler status.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const uiState = resolveUiState(compileState, status);
  const isCompiling = compileState === "compiling";
  const compileDisabled = isCompiling || uiState === "unavailable";

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
      setResult(response);

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
        setStatus((current) =>
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

  return (
    <section
      aria-label="Compiler panel"
      className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Compiler</h3>
          <p className="text-sm text-slate-600" aria-live="polite">
            {statusLabel(uiState)}
          </p>
          {status?.available && status.version ? (
            <p className="text-xs text-slate-500">{status.version}</p>
          ) : null}
          {statusError ? (
            <p className="text-xs text-amber-700">{statusError}</p>
          ) : null}
          {uiState === "unavailable" ? (
            <p className="text-xs text-amber-700">
              Local GCC was not detected. Editing remains available, but compile is
              disabled.
            </p>
          ) : null}
        </div>

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
      </div>

      {compileError ? (
        <p className="mt-3 text-sm text-red-700">{compileError}</p>
      ) : null}

      {result ? (
        <div className="mt-4 space-y-4">
          <CompilerDiagnostics diagnostics={result.diagnostics} />
          <CompilerOutput
            stdout={result.stdout}
            stderr={result.stderr}
            stdoutTruncated={result.stdoutTruncated}
            stderrTruncated={result.stderrTruncated}
          />
        </div>
      ) : null}
    </section>
  );
}
