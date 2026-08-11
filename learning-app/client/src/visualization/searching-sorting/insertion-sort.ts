import type { VisualizationTrace } from "../core/visualization-types";
import type {
  InsertionSortResult,
  InsertionSortStep,
  SortOrder,
} from "./trace-types";

function shouldShift(
  neighbor: number,
  key: number,
  order: SortOrder,
): boolean {
  return order === "ascending" ? neighbor > key : neighbor < key;
}

function isPrefixSorted(values: number[], endIndex: number, order: SortOrder): boolean {
  for (let i = 1; i <= endIndex; i += 1) {
    if (order === "ascending" && values[i]! < values[i - 1]!) {
      return false;
    }
    if (order === "descending" && values[i]! > values[i - 1]!) {
      return false;
    }
  }
  return true;
}

export function createInsertionSortTrace(
  input: number[],
  order: SortOrder,
): VisualizationTrace<InsertionSortStep, InsertionSortResult> {
  const values = [...input];
  const steps: InsertionSortStep[] = [];
  let comparisons = 0;
  let shifts = 0;
  let iterations = 0;

  if (values.length < 2) {
    steps.push({
      kind: "complete",
      values: [...values],
      comparisons: 0,
      shifts: 0,
      iterations: 0,
      narration:
        values.length === 0
          ? "The array is empty and already complete."
          : "One element is already sorted.",
    });
    return {
      algorithmId: "insertion-sort",
      steps,
      result: {
        sortedValues: [...values],
        comparisons: 0,
        shifts: 0,
        iterations: 0,
      },
    };
  }

  for (let i = 1; i < values.length; i += 1) {
    iterations = i;
    const keyValue = values[i]!;
    let j = i;

    steps.push({
      kind: "select-key",
      values: [...values],
      keyIndex: i,
      keyValue,
      iteration: i,
      comparisons,
      shifts,
      narration: `Select key ${keyValue} at index ${i}.`,
    });

    while (j > 0) {
      const compareIndex = j - 1;
      const neighbor = values[compareIndex]!;
      comparisons += 1;
      const needsShift = shouldShift(neighbor, keyValue, order);

      steps.push({
        kind: "compare",
        values: [...values],
        keyIndex: i,
        keyValue,
        compareIndex,
        iteration: i,
        comparisons,
        shifts,
        shouldShift: needsShift,
        narration: needsShift
          ? `${neighbor} is out of order relative to key ${keyValue}; shift it right.`
          : `${neighbor} is in order relative to key ${keyValue}; stop shifting.`,
      });

      if (!needsShift) {
        break;
      }

      values[j] = neighbor;
      shifts += 1;
      j -= 1;

      steps.push({
        kind: "shift",
        values: [...values],
        fromIndex: compareIndex,
        toIndex: compareIndex + 1,
        keyIndex: i,
        keyValue,
        iteration: i,
        comparisons,
        shifts,
        narration: `Shift ${neighbor} right to make room for the key ${keyValue}.`,
      });
    }

    values[j] = keyValue;
    steps.push({
      kind: "insert",
      values: [...values],
      insertIndex: j,
      keyValue,
      iteration: i,
      comparisons,
      shifts,
      narration: `Insert key ${keyValue} at index ${j}.`,
    });

    steps.push({
      kind: "iteration-complete",
      values: [...values],
      iteration: i,
      comparisons,
      shifts,
      narration: `Iteration ${i} complete. The prefix through index ${i} is sorted ${order}.`,
    });

    if (!isPrefixSorted(values, i, order)) {
      throw new Error("Processed prefix is not sorted after iteration");
    }
  }

  steps.push({
    kind: "complete",
    values: [...values],
    comparisons,
    shifts,
    iterations,
    narration: `Insertion sort finished in ${order} order.`,
  });

  return {
    algorithmId: "insertion-sort",
    steps,
    result: {
      sortedValues: [...values],
      comparisons,
      shifts,
      iterations,
    },
  };
}
