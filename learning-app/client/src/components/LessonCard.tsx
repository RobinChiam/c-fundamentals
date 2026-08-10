import { Link } from "react-router";
import type { LessonProgress, LessonSummary } from "@learning-app/shared";

export type LessonDisplayStatus = "not_started" | "in_progress" | "completed";

export function getLessonDisplayStatus(
  lessonId: string,
  progressByLessonId: Map<string, LessonProgress>,
): LessonDisplayStatus {
  const progress = progressByLessonId.get(lessonId);
  if (!progress) {
    return "not_started";
  }
  return progress.status;
}

export function formatLessonDisplayStatus(status: LessonDisplayStatus): string {
  switch (status) {
    case "not_started":
      return "Not started";
    case "in_progress":
      return "In progress";
    case "completed":
      return "Completed";
  }
}

interface LessonCardProps {
  lesson: LessonSummary;
  status: LessonDisplayStatus;
}

export function LessonCard({ lesson, status }: LessonCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Lesson {lesson.lessonNumber}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            <Link
              to={`/lessons/${lesson.id}`}
              className="hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
            >
              {lesson.title}
            </Link>
          </h2>
          <p className="mt-1 text-sm text-slate-600">{lesson.difficulty}</p>
          <p className="mt-2 text-sm font-medium text-slate-700">
            {formatLessonDisplayStatus(status)}
          </p>
        </div>
        <Link
          to={`/lessons/${lesson.id}`}
          className="inline-flex shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
        >
          Open lesson
        </Link>
      </div>
    </article>
  );
}
