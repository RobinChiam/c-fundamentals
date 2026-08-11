import { Link } from "react-router";
import { ControlFlowVisualizer } from "../visualization/control-flow/ControlFlowVisualizer";

export function ControlFlowVisualizerPage() {
  return (
    <article className="space-y-6">
      <header className="border-b border-slate-200 pb-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Lesson 4
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Loops and Input Validation — Visualizer
        </h1>
        <p className="mt-2 text-slate-600">
          Explore for, while, do-while, continue, and off-by-one control flow.
        </p>
        <Link
          to="/lessons/loops-and-input-validation"
          className="mt-4 inline-flex text-sm font-medium text-blue-700 hover:text-blue-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          ← Back to lesson
        </Link>
      </header>
      <ControlFlowVisualizer />
    </article>
  );
}
