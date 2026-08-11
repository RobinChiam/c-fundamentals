import type { VisualizationTrace } from "../core/visualization-types";
import type { BubbleSortResult, BubbleSortStep, SortOrder } from "./trace-types";

function isOutOfOrder(left: number, right: number, order: SortOrder): boolean {
  return order === "ascending" ? left > right : left < right;
}

export function createBubbleSortTrace(
  input: number[],
  order: SortOrder,
): VisualizationTrace<BubbleSortStep, BubbleSortResult> {
  const values = [...input];
  const steps: BubbleSortStep[] = [];
  let comparisons = 0;
  let swaps = 0;
  let pass = 0;

  if (values.length < 2) {
    steps.push({
      kind: "complete",
      values: [...values],
      comparisons: 0,
      swaps: 0,
      pass: 0,
      narration:
        values.length === 0
          ? "The array is empty and already complete."
          : "One element is already sorted.",
    });
    return {
      algorithmId: "bubble-sort",
      steps,
      result: {
        sortedValues: [...values],
        comparisons: 0,
        swaps: 0,
        passes: 0,
      },
    };
  }

  for (let i = 0; i < values.length - 1; i += 1) {
    pass = i + 1;
    let swappedInPass = false;

    for (let j = 0; j < values.length - 1 - i; j += 1) {
      const leftIndex = j;
      const rightIndex = j + 1;
      const leftValue = values[leftIndex]!;
      const rightValue = values[rightIndex]!;
      comparisons += 1;
      const shouldSwap = isOutOfOrder(leftValue, rightValue, order);

      steps.push({
        kind: "compare",
        values: [...values],
        leftIndex,
        rightIndex,
        comparisons,
        swaps,
        pass,
        shouldSwap,
        narration: shouldSwap
          ? `${leftValue} is ${order === "ascending" ? "greater than" : "less than"} ${rightValue}, so swap the adjacent values.`
          : `${leftValue} and ${rightValue} are already in order; no swap needed.`,
      });

      if (shouldSwap) {
        values[leftIndex] = rightValue;
        values[rightIndex] = leftValue;
        swaps += 1;
        swappedInPass = true;
        steps.push({
          kind: "swap",
          values: [...values],
          leftIndex,
          rightIndex,
          comparisons,
          swaps,
          pass,
          narration: `Swapped indices ${leftIndex} and ${rightIndex}.`,
        });
      }
    }

    steps.push({
      kind: "pass-complete",
      values: [...values],
      comparisons,
      swaps,
      pass,
      narration: `Pass ${pass} complete.`,
    });

    if (!swappedInPass) {
      steps.push({
        kind: "early-exit",
        values: [...values],
        comparisons,
        swaps,
        pass,
        narration: "No swaps occurred this pass, so the array is already sorted.",
      });
      break;
    }
  }

  const lastStep = steps[steps.length - 1];
  if (lastStep?.kind !== "early-exit") {
    steps.push({
      kind: "complete",
      values: [...values],
      comparisons,
      swaps,
      pass,
      narration: `Bubble sort finished in ${order} order.`,
    });
  }

  return {
    algorithmId: "bubble-sort",
    steps,
    result: {
      sortedValues: [...values],
      comparisons,
      swaps,
      passes: pass,
    },
  };
}
