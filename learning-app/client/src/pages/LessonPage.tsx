import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import type { LessonDetail, LessonSummary } from "@learning-app/shared";
import {
  CurriculumApiNotFoundError,
  CurriculumApiError,
  getLesson,
  getLessonFile,
  listCurriculum,
} from "../api/curriculum-api";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { MarkdownReader } from "../components/MarkdownReader";
import { CodeWorkspace } from "../components/CodeWorkspace/CodeWorkspace";
import { getAdjacentLessons } from "../lib/curriculum-navigation";

type LessonPageState =
  | { kind: "loading" }
  | { kind: "not-found" }
  | { kind: "error" }
  | {
      kind: "ready";
      lesson: LessonDetail;
      curriculum: LessonSummary[];
      readmeContent: string;
    };

export function LessonPage() {
  const { lessonId = "" } = useParams();
  const [state, setState] = useState<LessonPageState>({ kind: "loading" });
  const [retryToken, setRetryToken] = useState(0);

  const loadLesson = useCallback(async () => {
    if (!lessonId) {
      setState({ kind: "not-found" });
      return;
    }

    setState({ kind: "loading" });

    try {
      const [curriculumResponse, lesson] = await Promise.all([
        listCurriculum(),
        getLesson(lessonId),
      ]);

      const readme = lesson.files.find((file) => file.role === "readme");
      if (!readme) {
        throw new CurriculumApiError("Lesson is missing a README descriptor");
      }

      const readmeContent = await getLessonFile(lessonId, readme.id);

      setState({
        kind: "ready",
        lesson,
        curriculum: curriculumResponse.lessons,
        readmeContent: readmeContent.content,
      });
    } catch (error) {
      if (error instanceof CurriculumApiNotFoundError) {
        setState({ kind: "not-found" });
        return;
      }

      if (error instanceof CurriculumApiError) {
        setState({ kind: "error" });
        return;
      }

      setState({ kind: "error" });
    }
  }, [lessonId]);

  useEffect(() => {
    void loadLesson();
  }, [loadLesson, retryToken]);

  if (state.kind === "loading") {
    return <LoadingState message="Loading lesson…" />;
  }

  if (state.kind === "not-found") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Lesson not found</h1>
        <p className="text-slate-600">
          That lesson is not part of the current curriculum.
        </p>
        <Link
          to="/"
          className="inline-flex rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
        >
          Return to curriculum
        </Link>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <ErrorState
        message="Unable to load lesson"
        onRetry={() => setRetryToken((value) => value + 1)}
      />
    );
  }

  const { previous, next } = getAdjacentLessons(state.curriculum, state.lesson.id);

  return (
    <article>
      <header className="mb-8 border-b border-slate-200 pb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Lesson {state.lesson.lessonNumber}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          {state.lesson.title}
        </h1>
        <p className="mt-2 text-slate-600">{state.lesson.difficulty}</p>

        <nav
          aria-label="Lesson navigation"
          className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between"
        >
          <div>
            {previous ? (
              <Link
                to={`/lessons/${previous.id}`}
                className="text-sm font-medium text-blue-700 hover:text-blue-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                ← Previous: {previous.title}
              </Link>
            ) : null}
          </div>
          <div className="sm:text-right">
            {next ? (
              <Link
                to={`/lessons/${next.id}`}
                className="text-sm font-medium text-blue-700 hover:text-blue-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Next: {next.title} →
              </Link>
            ) : null}
          </div>
        </nav>
      </header>

      <MarkdownReader content={state.readmeContent} demoteHeadings />
      <CodeWorkspace lessonId={state.lesson.id} files={state.lesson.files} />
    </article>
  );
}
