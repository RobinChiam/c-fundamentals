import { isAscendingSorted } from "./input-parser";
import type { VisualizationTrace } from "../core/visualization-types";
import type { BinarySearchResult, BinarySearchStep } from "./trace-types";

export function createBinarySearchTrace(
  input: number[],
  target: number,
): VisualizationTrace<BinarySearchStep, BinarySearchResult> {
  const values = [...input];

  if (values.length === 0) {
    const steps: BinarySearchStep[] = [
      {
        kind: "not-found",
        values: [],
        comparisons: 0,
        narration: "The array is empty, so the target cannot be found.",
      },
    ];
    return {
      algorithmId: "binary-search",
      steps,
      result: { foundIndex: null, comparisons: 0, preconditionFailed: false },
    };
  }

  if (!isAscendingSorted(values)) {
    const steps: BinarySearchStep[] = [
      {
        kind: "precondition-failed",
        values: [...values],
        narration:
          "Binary search requires ascending sorted input. The current array is not sorted ascending.",
      },
    ];
    return {
      algorithmId: "binary-search",
      steps,
      result: { foundIndex: null, comparisons: 0, preconditionFailed: true },
    };
  }

  const steps: BinarySearchStep[] = [];
  let comparisons = 0;
  let lo = 0;
  let hi = values.length - 1;

  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const midValue = values[mid]!;
    comparisons += 1;

    if (midValue === target) {
      steps.push({
        kind: "found",
        values: [...values],
        low: lo,
        high: hi,
        mid,
        comparisons,
        narration: `Check mid index ${mid}. The value is ${midValue}. Found the target.`,
      });
      return {
        algorithmId: "binary-search",
        steps,
        result: { foundIndex: mid, comparisons, preconditionFailed: false },
      };
    }

    if (midValue < target) {
      steps.push({
        kind: "check",
        values: [...values],
        low: lo,
        high: hi,
        mid,
        comparisons,
        comparison: "less",
        narration: `${target} is greater than ${midValue}, so discard the left half.`,
      });
      lo = mid + 1;
      continue;
    }

    steps.push({
      kind: "check",
      values: [...values],
      low: lo,
      high: hi,
      mid,
      comparisons,
      comparison: "greater",
      narration: `${target} is less than ${midValue}, so discard the right half.`,
    });

    if (mid === 0) {
      break;
    }
    hi = mid - 1;
  }

  steps.push({
    kind: "not-found",
    values: [...values],
    comparisons,
    narration: `The search range is empty. ${target} was not found.`,
  });

  return {
    algorithmId: "binary-search",
    steps,
    result: { foundIndex: null, comparisons, preconditionFailed: false },
  };
}
