import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import type { LessonArchitectureResponse } from "@learning-app/shared";
import {
  ArchitectureApiError,
  ArchitectureApiNotFoundError,
  getLessonArchitecture,
} from "../api/architecture-api";
import { ArchitectureExplorer } from "../architecture/ArchitectureExplorer";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";

type PageState =
  | { kind: "loading" }
  | { kind: "not-found" }
  | { kind: "error" }
  | { kind: "ready"; architecture: LessonArchitectureResponse };

export function LessonArchitecturePage() {
  const { lessonId = "" } = useParams();
  const [state, setState] = useState<PageState>({ kind: "loading" });
  const [retryToken, setRetryToken] = useState(0);

  const loadArchitecture = useCallback(async () => {
    if (!lessonId) {
      setState({ kind: "not-found" });
      return;
    }

    setState({ kind: "loading" });

    try {
      const architecture = await getLessonArchitecture(lessonId);
      setState({ kind: "ready", architecture });
    } catch (error) {
      if (error instanceof ArchitectureApiNotFoundError) {
        setState({ kind: "not-found" });
        return;
      }
      if (error instanceof ArchitectureApiError) {
        setState({ kind: "error" });
        return;
      }
      setState({ kind: "error" });
    }
  }, [lessonId]);

  useEffect(() => {
    void loadArchitecture();
  }, [loadArchitecture, retryToken]);

  if (state.kind === "loading") {
    return <LoadingState message="Loading architecture explorer…" />;
  }

  if (state.kind === "not-found") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Architecture not available</h1>
        <p className="text-slate-600">
          Architecture exploration is not supported for this lesson.
        </p>
        <Link
          to={lessonId ? `/lessons/${lessonId}` : "/"}
          className="inline-flex rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
        >
          Back to lesson
        </Link>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <ErrorState
        message="Unable to load architecture explorer"
        onRetry={() => setRetryToken((value) => value + 1)}
      />
    );
  }

  return (
    <article className="space-y-6">
      <header className="border-b border-slate-200 pb-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Architecture Explorer
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          {state.architecture.lessonTitle}
        </h1>
        <Link
          to={`/lessons/${state.architecture.lessonId}`}
          className="mt-4 inline-flex text-sm font-medium text-blue-700 hover:text-blue-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          ← Back to lesson
        </Link>
      </header>
      <ArchitectureExplorer architecture={state.architecture} />
    </article>
  );
}
