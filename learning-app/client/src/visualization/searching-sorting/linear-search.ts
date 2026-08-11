import type { VisualizationTrace } from "../core/visualization-types";
import type { LinearSearchResult, LinearSearchStep } from "./trace-types";

export function createLinearSearchTrace(
  input: number[],
  target: number,
): VisualizationTrace<LinearSearchStep, LinearSearchResult> {
  const values = [...input];
  const steps: LinearSearchStep[] = [];
  let comparisons = 0;

  if (values.length === 0) {
    steps.push({
      kind: "not-found",
      values: [...values],
      comparisons: 0,
      narration: "The array is empty, so the target cannot be found.",
    });
    return {
      algorithmId: "linear-search",
      steps,
      result: { foundIndex: null, comparisons: 0 },
    };
  }

  for (let index = 0; index < values.length; index += 1) {
    comparisons += 1;
    const current = values[index]!;
    if (current === target) {
      steps.push({
        kind: "found",
        values: [...values],
        index,
        comparisons,
        narration: `Check index ${index}. The value is ${current}. Found the target.`,
      });
      return {
        algorithmId: "linear-search",
        steps,
        result: { foundIndex: index, comparisons },
      };
    }

    steps.push({
      kind: "check",
      values: [...values],
      index,
      comparisons,
      narration: `Check index ${index}. The value is ${current}.`,
    });
  }

  steps.push({
    kind: "not-found",
    values: [...values],
    comparisons,
    narration: `Checked every index. ${target} was not found.`,
  });

  return {
    algorithmId: "linear-search",
    steps,
    result: { foundIndex: null, comparisons },
  };
}
