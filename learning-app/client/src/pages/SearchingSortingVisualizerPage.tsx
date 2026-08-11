import { Link } from "react-router";
import { SearchingSortingVisualizer } from "../visualization/searching-sorting/SearchingSortingVisualizer";

export function SearchingSortingVisualizerPage() {
  return (
    <article className="space-y-6">
      <header className="border-b border-slate-200 pb-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Lesson 13
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Searching and Sorting — Visualizer
        </h1>
        <p className="mt-2 text-slate-600">
          Explore linear search, binary search, bubble sort, and insertion sort with
          step-by-step playback.
        </p>
        <Link
          to="/lessons/searching-and-sorting"
          className="mt-4 inline-flex text-sm font-medium text-blue-700 hover:text-blue-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          ← Back to lesson
        </Link>
      </header>
      <SearchingSortingVisualizer />
    </article>
  );
}
