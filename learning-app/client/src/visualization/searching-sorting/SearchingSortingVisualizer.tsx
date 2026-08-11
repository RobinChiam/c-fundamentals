import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrayLegend } from "../arrays/ArrayLegend";
import { ArrayVisualizer } from "../arrays/ArrayVisualizer";
import { MetricsPanel } from "../core/MetricsPanel";
import { NarrationPanel } from "../core/NarrationPanel";
import { PlaybackControls } from "../core/PlaybackControls";
import { StepCounter } from "../core/StepCounter";
import { usePlayback } from "../core/usePlayback";
import { VisualizationShell } from "../core/VisualizationShell";
import { createSearchSortTrace } from "./create-trace";
import {
  formatArrayInput,
  generateRandomArray,
  parseArrayInput,
  parseTargetInput,
  sortAscending,
} from "./input-parser";
import { stepMetrics, stepNarration, stepToArrayCells } from "./step-rendering";
import {
  ALGORITHM_OPTIONS,
  DEFAULT_ARRAY_INPUT,
  DEFAULT_TARGET,
  type SearchSortAlgorithmId,
  type SortOrder,
} from "./trace-types";

function usePrefersReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}

function isSearchAlgorithm(algorithmId: SearchSortAlgorithmId): boolean {
  return algorithmId === "linear-search" || algorithmId === "binary-search";
}

const COMPLEXITY_SUMMARY: Record<
  SearchSortAlgorithmId,
  { complexity: string; note: string }
> = {
  "linear-search": {
    complexity: "O(n)",
    note: "May examine every element.",
  },
  "binary-search": {
    complexity: "O(log n)",
    note: "Requires ascending sorted input.",
  },
  "bubble-sort": {
    complexity: "O(n²)",
    note: "Teaching algorithm with adjacent swaps.",
  },
  "insertion-sort": {
    complexity: "O(n²) worst case",
    note: "Useful for small or nearly sorted input.",
  },
};

export function SearchingSortingVisualizer() {
  const [algorithmId, setAlgorithmId] =
    useState<SearchSortAlgorithmId>("linear-search");
  const [arrayInput, setArrayInput] = useState(DEFAULT_ARRAY_INPUT);
  const [targetInput, setTargetInput] = useState(String(DEFAULT_TARGET));
  const [sortOrder, setSortOrder] = useState<SortOrder>("ascending");
  const [inputError, setInputError] = useState<string | null>(null);
  const [targetError, setTargetError] = useState<string | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  const parsedArray = useMemo(() => parseArrayInput(arrayInput), [arrayInput]);
  const parsedTarget = useMemo(() => parseTargetInput(targetInput), [targetInput]);

  const values = parsedArray.ok ? parsedArray.values : [];
  const target = parsedTarget.ok ? parsedTarget.values[0]! : DEFAULT_TARGET;

  const trace = useMemo(() => {
    if (!parsedArray.ok) {
      return createSearchSortTrace("linear-search", [], {
        target: DEFAULT_TARGET,
        sortOrder,
      });
    }
    if (isSearchAlgorithm(algorithmId) && !parsedTarget.ok) {
      return createSearchSortTrace("linear-search", [], {
        target: DEFAULT_TARGET,
        sortOrder,
      });
    }
    return createSearchSortTrace(algorithmId, values, {
      target: isSearchAlgorithm(algorithmId) ? target : DEFAULT_TARGET,
      sortOrder,
    });
  }, [algorithmId, values, target, sortOrder, parsedArray.ok, parsedTarget.ok]);

  const playback = usePlayback(trace.steps.length);
  const { reset } = playback;
  const currentStep = trace.steps[playback.stepIndex];

  useEffect(() => {
    reset();
  }, [algorithmId, arrayInput, targetInput, sortOrder, reset]);

  const handleSortInputAscending = () => {
    if (!parsedArray.ok) {
      return;
    }
    setArrayInput(formatArrayInput(sortAscending(parsedArray.values)));
  };

  const handleGenerateRandom = () => {
    setArrayInput(formatArrayInput(generateRandomArray()));
  };

  const showBinaryWarning =
    algorithmId === "binary-search" &&
    parsedArray.ok &&
    currentStep?.kind === "precondition-failed";

  const cells = currentStep ? stepToArrayCells(currentStep) : [];
  const narration = currentStep ? stepNarration(currentStep) : "";
  const metrics = currentStep ? stepMetrics(currentStep) : [];

  return (
    <VisualizationShell
      title="Searching & Sorting Visualizer"
      notice={
        <>
          This visualizer demonstrates the lesson algorithms with the selected data.
          It does not trace your edited C program.
        </>
      }
      controls={
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <fieldset>
              <legend className="text-sm font-semibold text-slate-700">Algorithm</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {ALGORITHM_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
                  >
                    <input
                      type="radio"
                      name="algorithm"
                      value={option.id}
                      checked={algorithmId === option.id}
                      onChange={() => setAlgorithmId(option.id)}
                      className="h-4 w-4"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="block text-sm font-semibold text-slate-700">
              Array values (comma-separated)
              <input
                type="text"
                value={arrayInput}
                onChange={(event) => {
                  setArrayInput(event.target.value);
                  const result = parseArrayInput(event.target.value);
                  setInputError(result.ok ? null : result.error);
                }}
                aria-invalid={inputError ? true : undefined}
                aria-describedby={inputError ? "array-input-error" : undefined}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              />
            </label>
            {inputError ? (
              <p id="array-input-error" className="text-sm text-red-700">
                {inputError}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleGenerateRandom}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Generate Random Array
              </button>
              {algorithmId === "binary-search" ? (
                <button
                  type="button"
                  onClick={handleSortInputAscending}
                  disabled={!parsedArray.ok}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Sort Input Ascending
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            {isSearchAlgorithm(algorithmId) ? (
              <label className="block text-sm font-semibold text-slate-700">
                Target
                <input
                  type="text"
                  value={targetInput}
                  onChange={(event) => {
                    setTargetInput(event.target.value);
                    const result = parseTargetInput(event.target.value);
                    setTargetError(result.ok ? null : result.error);
                  }}
                  aria-invalid={targetError ? true : undefined}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                />
              </label>
            ) : null}
            {isSearchAlgorithm(algorithmId) && targetError ? (
              <p className="text-sm text-red-700">{targetError}</p>
            ) : null}

            {!isSearchAlgorithm(algorithmId) ? (
              <fieldset>
                <legend className="text-sm font-semibold text-slate-700">Sort order</legend>
                <div className="mt-2 flex gap-3">
                  {(["ascending", "descending"] as const).map((order) => (
                    <label
                      key={order}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm capitalize focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
                    >
                      <input
                        type="radio"
                        name="sort-order"
                        value={order}
                        checked={sortOrder === order}
                        onChange={() => setSortOrder(order)}
                        className="h-4 w-4"
                      />
                      {order}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            <ArrayLegend />
          </div>
        </div>
      }
      playback={
        <PlaybackControls
          playing={playback.playing}
          canPlay={playback.stepIndex < playback.maxIndex && parsedArray.ok}
          speed={playback.speed}
          onReset={playback.reset}
          onPrevious={playback.previous}
          onPlay={playback.play}
          onPause={playback.pause}
          onNext={playback.next}
          onEnd={playback.end}
          onSpeedChange={playback.setSpeed}
        />
      }
      stepCounter={
        <StepCounter
          currentStep={trace.steps.length === 0 ? 0 : playback.stepIndex + 1}
          totalSteps={Math.max(trace.steps.length, 1)}
        />
      }
      visualization={
        <div className="space-y-3">
          {showBinaryWarning ? (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              Binary search requires ascending sorted input. Sort the array or choose
              linear search.
            </div>
          ) : null}
          {parsedArray.ok ? (
            <ArrayVisualizer cells={cells} reducedMotion={reducedMotion} />
          ) : (
            <p className="text-sm text-slate-600">Fix the array input to visualize.</p>
          )}
        </div>
      }
      narration={<NarrationPanel narration={narration} />}
      metrics={<MetricsPanel metrics={metrics} />}
      complexity={
        <section className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <h3 className="font-semibold text-slate-900">Complexity summary</h3>
          <p className="mt-2">
            <span className="font-medium">{COMPLEXITY_SUMMARY[algorithmId].complexity}</span>
            {" — "}
            {COMPLEXITY_SUMMARY[algorithmId].note}
          </p>
          <p className="mt-2">
            <Link
              to="/lessons/searching-and-sorting"
              className="font-medium text-blue-700 hover:text-blue-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Return to lesson material
            </Link>
          </p>
        </section>
      }
    />
  );
}
