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
import {
  PersistenceApiError,
  PersistenceApiUnavailableError,
  updateLessonProgress,
  visitLesson,
} from "../api/persistence-api";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { MarkdownReader } from "../components/MarkdownReader";
import { CodeWorkspace } from "../components/CodeWorkspace/CodeWorkspace";
import { PracticeLabsSection } from "../components/PracticeLabsSection";
import { getAdjacentLessons } from "../lib/curriculum-navigation";
import { listLessonLabs } from "../api/labs-api";
import type { LabSummary } from "@learning-app/shared";

type LessonPageState =
  | { kind: "loading" }
  | { kind: "not-found" }
  | { kind: "error" }
  | {
      kind: "ready";
      lesson: LessonDetail;
      curriculum: LessonSummary[];
      readmeContent: string;
      progressStatus: "in_progress" | "completed" | null;
      progressError: string | null;
      labs: LabSummary[];
    };

export function LessonPage() {
  const { lessonId = "" } = useParams();
  const [state, setState] = useState<LessonPageState>({ kind: "loading" });
  const [retryToken, setRetryToken] = useState(0);
  const [progressUpdating, setProgressUpdating] = useState(false);

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

      let progressStatus: "in_progress" | "completed" | null = null;
      let progressError: string | null = null;
      let labs: LabSummary[] = [];

      try {
        const progress = await visitLesson(lessonId);
        progressStatus = progress.status;
      } catch (error) {
        if (
          !(error instanceof PersistenceApiUnavailableError) &&
          !(error instanceof PersistenceApiError)
        ) {
          throw error;
        }
        progressError = "Progress tracking is unavailable";
      }

      try {
        labs = await listLessonLabs(lessonId);
      } catch {
        labs = [];
      }

      setState({
        kind: "ready",
        lesson,
        curriculum: curriculumResponse.lessons,
        readmeContent: readmeContent.content,
        progressStatus,
        progressError,
        labs,
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

  const handleProgressUpdate = async (
    status: "in_progress" | "completed",
  ) => {
    if (state.kind !== "ready") {
      return;
    }

    setProgressUpdating(true);
    try {
      const progress = await updateLessonProgress(state.lesson.id, status);
      setState({
        ...state,
        progressStatus: progress.status,
        progressError: null,
      });
    } catch {
      setState({
        ...state,
        progressError: "Unable to update lesson progress",
      });
    } finally {
      setProgressUpdating(false);
    }
  };

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

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {state.progressStatus === "completed" ? (
            <>
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                Completed
              </span>
              <button
                type="button"
                disabled={progressUpdating}
                onClick={() => {
                  void handleProgressUpdate("in_progress");
                }}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
              >
                Mark In Progress
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={progressUpdating}
              onClick={() => {
                void handleProgressUpdate("completed");
              }}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            >
              Mark Lesson Complete
            </button>
          )}
          {state.progressError ? (
            <p className="text-sm text-amber-700">{state.progressError}</p>
          ) : null}
        </div>

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
      {state.lesson.id === "searching-and-sorting" ? (
        <section className="my-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Explore algorithms</h2>
          <p className="mt-1 text-sm text-slate-700">
            Step through linear search, binary search, bubble sort, and insertion sort
            with the interactive visualizer.
          </p>
          <Link
            to="/lessons/searching-and-sorting/visualize"
            className="mt-3 inline-flex rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Open Visualizer
          </Link>
        </section>
      ) : null}
      {state.lesson.id === "functions-and-scope" ? (
        <section className="my-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Explore function calls</h2>
          <p className="mt-1 text-sm text-slate-700">
            Step through pass-by-value and recursive factorial with conceptual call frames.
          </p>
          <Link
            to="/lessons/functions-and-scope/visualize"
            className="mt-3 inline-flex rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Open Visualizer
          </Link>
        </section>
      ) : null}
      {state.lesson.id === "pointers" ? (
        <section className="my-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Explore pointers</h2>
          <p className="mt-1 text-sm text-slate-700">
            Step through address-of, dereference, swap, array walks, and NULL safety.
          </p>
          <Link
            to="/lessons/pointers/visualize"
            className="mt-3 inline-flex rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Open Visualizer
          </Link>
        </section>
      ) : null}
      {state.lesson.id === "dynamic-memory-allocation" ? (
        <section className="my-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Explore dynamic memory</h2>
          <p className="mt-1 text-sm text-slate-700">
            Step through malloc, calloc, free, realloc, and ownership pitfalls.
          </p>
          <Link
            to="/lessons/dynamic-memory-allocation/visualize"
            className="mt-3 inline-flex rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Open Visualizer
          </Link>
        </section>
      ) : null}
      {state.lesson.id === "loops-and-input-validation" ? (
        <section className="my-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Explore control flow</h2>
          <p className="mt-1 text-sm text-slate-700">
            Step through for, while, do-while, continue, and off-by-one loops.
          </p>
          <Link
            to="/lessons/loops-and-input-validation/visualize"
            className="mt-3 inline-flex rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Open Visualizer
          </Link>
        </section>
      ) : null}
      <PracticeLabsSection lessonId={state.lesson.id} labs={state.labs} />
      <CodeWorkspace lessonId={state.lesson.id} files={state.lesson.files} />
    </article>
  );
}
