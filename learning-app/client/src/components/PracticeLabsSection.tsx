import { Link } from "react-router";
import type { LabSummary } from "@learning-app/shared";

interface PracticeLabsSectionProps {
  lessonId: string;
  labs: LabSummary[];
}

function statusLabel(status: LabSummary["status"]): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "in_progress":
      return "In progress";
    default:
      return "Not started";
  }
}

export function PracticeLabsSection({
  lessonId,
  labs,
}: PracticeLabsSectionProps) {
  if (labs.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 border-t border-slate-200 pt-8">
      <h2 className="text-xl font-semibold text-slate-900">Practice Labs</h2>
      <p className="mt-2 text-sm text-slate-600">
        Structured exercises with automated tests for selected README practice
        problems.
      </p>
      <ul className="mt-4 space-y-3">
        {labs.map((lab) => (
          <li
            key={lab.id}
            className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-medium text-slate-500">
                Exercise {lab.exerciseNumber}
              </p>
              <h3 className="text-base font-semibold text-slate-900">
                {lab.title}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {statusLabel(lab.status)}
              </p>
            </div>
            <Link
              to={`/lessons/${lessonId}/labs/${lab.id}`}
              className="inline-flex rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {lab.status === "not_started" ? "Start" : "Continue"}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
