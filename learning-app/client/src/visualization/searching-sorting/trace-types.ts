import type { VisualizationTrace } from "../core/visualization-types";

export type SortOrder = "ascending" | "descending";

export type SearchSortAlgorithmId =
  | "linear-search"
  | "binary-search"
  | "bubble-sort"
  | "insertion-sort";

export type ArrayCellRole =
  | "default"
  | "active"
  | "comparing"
  | "matched"
  | "excluded"
  | "sorted"
  | "swapping"
  | "key"
  | "range";

export interface ArrayCellState {
  index: number;
  value: number;
  role: ArrayCellRole;
  label?: string;
}

export interface LinearSearchResult {
  foundIndex: number | null;
  comparisons: number;
}

export type LinearSearchStep =
  | {
      kind: "check";
      values: number[];
      index: number;
      comparisons: number;
      narration: string;
    }
  | {
      kind: "found";
      values: number[];
      index: number;
      comparisons: number;
      narration: string;
    }
  | {
      kind: "not-found";
      values: number[];
      comparisons: number;
      narration: string;
    };

export interface BinarySearchResult {
  foundIndex: number | null;
  comparisons: number;
  preconditionFailed: boolean;
}

export type BinarySearchStep =
  | {
      kind: "precondition-failed";
      values: number[];
      narration: string;
    }
  | {
      kind: "check";
      values: number[];
      low: number;
      high: number;
      mid: number;
      comparisons: number;
      comparison: "equal" | "less" | "greater";
      narration: string;
    }
  | {
      kind: "found";
      values: number[];
      low: number;
      high: number;
      mid: number;
      comparisons: number;
      narration: string;
    }
  | {
      kind: "not-found";
      values: number[];
      comparisons: number;
      narration: string;
    };

export interface BubbleSortResult {
  sortedValues: number[];
  comparisons: number;
  swaps: number;
  passes: number;
}

export type BubbleSortStep =
  | {
      kind: "compare";
      values: number[];
      leftIndex: number;
      rightIndex: number;
      comparisons: number;
      swaps: number;
      pass: number;
      shouldSwap: boolean;
      narration: string;
    }
  | {
      kind: "swap";
      values: number[];
      leftIndex: number;
      rightIndex: number;
      comparisons: number;
      swaps: number;
      pass: number;
      narration: string;
    }
  | {
      kind: "pass-complete";
      values: number[];
      comparisons: number;
      swaps: number;
      pass: number;
      narration: string;
    }
  | {
      kind: "early-exit";
      values: number[];
      comparisons: number;
      swaps: number;
      pass: number;
      narration: string;
    }
  | {
      kind: "complete";
      values: number[];
      comparisons: number;
      swaps: number;
      pass: number;
      narration: string;
    };

export interface InsertionSortResult {
  sortedValues: number[];
  comparisons: number;
  shifts: number;
  iterations: number;
}

export type InsertionSortStep =
  | {
      kind: "select-key";
      values: number[];
      keyIndex: number;
      keyValue: number;
      iteration: number;
      comparisons: number;
      shifts: number;
      narration: string;
    }
  | {
      kind: "compare";
      values: number[];
      keyIndex: number;
      keyValue: number;
      compareIndex: number;
      iteration: number;
      comparisons: number;
      shifts: number;
      shouldShift: boolean;
      narration: string;
    }
  | {
      kind: "shift";
      values: number[];
      fromIndex: number;
      toIndex: number;
      keyIndex: number;
      keyValue: number;
      iteration: number;
      comparisons: number;
      shifts: number;
      narration: string;
    }
  | {
      kind: "insert";
      values: number[];
      insertIndex: number;
      keyValue: number;
      iteration: number;
      comparisons: number;
      shifts: number;
      narration: string;
    }
  | {
      kind: "iteration-complete";
      values: number[];
      iteration: number;
      comparisons: number;
      shifts: number;
      narration: string;
    }
  | {
      kind: "complete";
      values: number[];
      comparisons: number;
      shifts: number;
      iterations: number;
      narration: string;
    };

export type SearchSortStep =
  | LinearSearchStep
  | BinarySearchStep
  | BubbleSortStep
  | InsertionSortStep;

export type SearchSortTrace =
  | VisualizationTrace<LinearSearchStep, LinearSearchResult>
  | VisualizationTrace<BinarySearchStep, BinarySearchResult>
  | VisualizationTrace<BubbleSortStep, BubbleSortResult>
  | VisualizationTrace<InsertionSortStep, InsertionSortResult>;

export const DEFAULT_ARRAY_INPUT = "42, 7, 19, 3, 42, 11";
export const DEFAULT_TARGET = 19;

export const ALGORITHM_OPTIONS: Array<{
  id: SearchSortAlgorithmId;
  label: string;
}> = [
  { id: "linear-search", label: "Linear Search" },
  { id: "binary-search", label: "Binary Search" },
  { id: "bubble-sort", label: "Bubble Sort" },
  { id: "insertion-sort", label: "Insertion Sort" },
];
