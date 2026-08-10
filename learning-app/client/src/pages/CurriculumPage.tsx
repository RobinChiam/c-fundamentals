import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import type { LearningState, LessonSummary } from "@learning-app/shared";
import {
  CurriculumApiError,
  listCurriculum,
} from "../api/curriculum-api";
import {
  PersistenceApiError,
  PersistenceApiUnavailableError,
  getLearningState,
} from "../api/persistence-api";
import { LessonCard } from "../components/LessonCard";
import { getLessonDisplayStatus } from "../components/LessonCard";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { groupLessonsByPresentation } from "../lib/curriculum-navigation";

type CurriculumPageState =
  | { kind: "loading" }
  | { kind: "error" }
  | {
      kind: "ready";
      lessons: LessonSummary[];
      learningState: LearningState | null;
    };

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

      let learningState: LearningState | null = null;
      try {
        learningState = await getLearningState();
      } catch (error) {
        if (
          !(error instanceof PersistenceApiUnavailableError) &&
          !(error instanceof PersistenceApiError)
        ) {
          throw error;
        }
      }

      setState({ kind: "ready", lessons: ordered, learningState });
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

  const progressByLessonId = useMemo(() => {
    const map = new Map<string, LearningState["lessons"][number]>();
    if (state.kind === "ready" && state.learningState) {
      for (const progress of state.learningState.lessons) {
        map.set(progress.lessonId, progress);
      }
    }
    return map;
  }, [state]);

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
  const completedCount = state.learningState
    ? state.learningState.lessons.filter((lesson) => lesson.status === "completed")
        .length
    : 0;
  const continueLesson =
    state.learningState?.lastLessonId &&
    state.lessons.some((lesson) => lesson.id === state.learningState?.lastLessonId)
      ? state.lessons.find((lesson) => lesson.id === state.learningState?.lastLessonId)
      : null;

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Curriculum</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Browse all lessons in curriculum order. Select a lesson to read its
          repository README and inspect its teaching source files.
        </p>
        {state.learningState ? (
          <p className="mt-3 text-sm font-medium text-slate-700">
            {completedCount} of {state.lessons.length} completed
          </p>
        ) : null}
        {continueLesson ? (
          <div className="mt-4">
            <Link
              to={`/lessons/${continueLesson.id}`}
              className="inline-flex rounded-md border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800 hover:bg-blue-100"
            >
              Continue Learning: {continueLesson.title}
            </Link>
          </div>
        ) : null}
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
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  status={getLessonDisplayStatus(lesson.id, progressByLessonId)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
