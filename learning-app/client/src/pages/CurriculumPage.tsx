import { useCallback, useEffect, useState } from "react";
import type { LessonSummary } from "@learning-app/shared";
import {
  CurriculumApiError,
  listCurriculum,
} from "../api/curriculum-api";
import { LessonCard } from "../components/LessonCard";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { groupLessonsByPresentation } from "../lib/curriculum-navigation";

type CurriculumPageState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; lessons: LessonSummary[] };

export function CurriculumPage() {
  const [state, setState] = useState<CurriculumPageState>({ kind: "loading" });
  const [retryToken, setRetryToken] = useState(0);

  const loadCurriculum = useCallback(async () => {
    setState({ kind: "loading" });

    try {
      const response = await listCurriculum();
      const ordered = [...response.lessons].sort(
        (left, right) => left.sequence - right.sequence,
      );
      setState({ kind: "ready", lessons: ordered });
    } catch (error) {
      if (error instanceof CurriculumApiError) {
        setState({ kind: "error" });
        return;
      }
      setState({ kind: "error" });
    }
  }, []);

  useEffect(() => {
    void loadCurriculum();
  }, [loadCurriculum, retryToken]);

  if (state.kind === "loading") {
    return <LoadingState message="Loading curriculum…" />;
  }

  if (state.kind === "error") {
    return (
      <ErrorState
        message="Unable to load curriculum"
        onRetry={() => setRetryToken((value) => value + 1)}
      />
    );
  }

  const groups = groupLessonsByPresentation(state.lessons);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Curriculum</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Browse all lessons in curriculum order. Select a lesson to read its
          repository README and inspect its teaching source files.
        </p>
      </header>

      <div className="space-y-10">
        {groups.map((group) => (
          <section key={group.label} aria-labelledby={`group-${group.label}`}>
            <h2
              id={`group-${group.label}`}
              className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500"
            >
              {group.label}
            </h2>
            <div className="grid gap-4">
              {group.lessons.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
