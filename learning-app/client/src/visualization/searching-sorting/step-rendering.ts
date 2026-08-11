import type {
  ArrayCellState,
  BinarySearchStep,
  BubbleSortStep,
  InsertionSortStep,
  LinearSearchStep,
  SearchSortStep,
} from "./trace-types";

function defaultCells(values: number[]): ArrayCellState[] {
  return values.map((value, index) => ({
    index,
    value,
    role: "default",
  }));
}

function markIndices(
  cells: ArrayCellState[],
  indices: number[],
  role: ArrayCellState["role"],
  label?: string,
): ArrayCellState[] {
  const indexSet = new Set(indices);
  return cells.map((cell) =>
    indexSet.has(cell.index) ? { ...cell, role, label } : cell,
  );
}

function markRange(
  cells: ArrayCellState[],
  low: number,
  high: number,
  role: ArrayCellState["role"] = "range",
): ArrayCellState[] {
  return cells.map((cell) =>
    cell.index >= low && cell.index <= high ? { ...cell, role } : cell,
  );
}

function markExcludedOutsideRange(
  cells: ArrayCellState[],
  low: number,
  high: number,
): ArrayCellState[] {
  return cells.map((cell) =>
    cell.index < low || cell.index > high
      ? { ...cell, role: "excluded", label: "Excluded" }
      : cell,
  );
}

function linearCells(step: LinearSearchStep): ArrayCellState[] {
  const cells = defaultCells(step.values);
  if (step.kind === "check") {
    return markIndices(cells, [step.index], "active", "Current");
  }
  if (step.kind === "found") {
    return markIndices(cells, [step.index], "matched", "Match");
  }
  return cells;
}

function binaryCells(step: BinarySearchStep): ArrayCellState[] {
  const cells = defaultCells(step.values);
  if (step.kind === "precondition-failed") {
    return cells;
  }
  if (step.kind === "not-found") {
    return cells;
  }
  const withRange = markRange(cells, step.low, step.high, "range");
  const withExcluded = markExcludedOutsideRange(withRange, step.low, step.high);
  if (step.kind === "found") {
    return markIndices(withExcluded, [step.mid], "matched", "Match");
  }
  return markIndices(withExcluded, [step.mid], "active", "Mid");
}

function bubbleCells(step: BubbleSortStep): ArrayCellState[] {
  const cells = defaultCells(step.values);
  const n = step.values.length;

  if (step.kind === "complete" || step.kind === "early-exit") {
    return cells.map((cell) => ({ ...cell, role: "sorted" as const, label: "Sorted" }));
  }

  let next = cells;

  if (step.kind === "pass-complete") {
    const sortedBoundary = Math.max(0, n - step.pass);
    next = cells.map((cell) =>
      cell.index >= sortedBoundary
        ? { ...cell, role: "sorted" as const, label: "Sorted" }
        : cell,
    );
  }

  if (step.kind === "compare") {
    next = markIndices(next, [step.leftIndex, step.rightIndex], "comparing", "Comparing");
  } else if (step.kind === "swap") {
    next = markIndices(next, [step.leftIndex, step.rightIndex], "swapping", "Swapping");
  }

  return next;
}

function insertionCells(step: InsertionSortStep): ArrayCellState[] {
  const cells = defaultCells(step.values);

  if (step.kind === "select-key") {
    return markIndices(cells, [step.keyIndex], "key", "Key");
  }

  if (step.kind === "compare") {
    let next = markIndices(cells, [step.compareIndex], "comparing", "Comparing");
    if (step.values[step.keyIndex] === step.keyValue) {
      next = markIndices(next, [step.keyIndex], "key", "Key");
    }
    return next;
  }

  if (step.kind === "shift") {
    return markIndices(cells, [step.fromIndex, step.toIndex], "swapping", "Shift");
  }

  if (step.kind === "insert") {
    return cells.map((cell) => {
      if (cell.index === step.insertIndex) {
        return { ...cell, role: "active" as const, label: "Insert" };
      }
      if (cell.index <= step.iteration) {
        return { ...cell, role: "sorted" as const, label: "Sorted" };
      }
      return cell;
    });
  }

  if (step.kind === "iteration-complete") {
    return cells.map((cell) =>
      cell.index <= step.iteration ? { ...cell, role: "sorted", label: "Sorted" } : cell,
    );
  }

  if (step.kind === "complete") {
    return cells.map((cell) => ({ ...cell, role: "sorted", label: "Sorted" }));
  }

  return cells;
}

export function stepToArrayCells(step: SearchSortStep): ArrayCellState[] {
  switch (step.kind) {
    case "check":
      if ("mid" in step) {
        return binaryCells(step);
      }
      return linearCells(step);
    case "found":
      if ("mid" in step) {
        return binaryCells(step);
      }
      return linearCells(step);
    case "not-found":
      if ("mid" in step || "low" in step) {
        return binaryCells(step as BinarySearchStep);
      }
      return linearCells(step as LinearSearchStep);
    case "precondition-failed":
      return binaryCells(step);
    case "compare":
      if ("leftIndex" in step) {
        return bubbleCells(step as BubbleSortStep);
      }
      return insertionCells(step as InsertionSortStep);
    case "swap":
      return bubbleCells(step);
    case "pass-complete":
    case "early-exit":
      return bubbleCells(step);
    case "complete":
      if ("pass" in step) {
        return bubbleCells(step as BubbleSortStep);
      }
      return insertionCells(step as InsertionSortStep);
    case "select-key":
    case "shift":
    case "insert":
    case "iteration-complete":
      return insertionCells(step as InsertionSortStep);
    default:
      return defaultCells((step as { values: number[] }).values ?? []);
  }
}

export function stepNarration(step: SearchSortStep): string {
  return step.narration;
}

export function stepMetrics(
  step: SearchSortStep,
): Array<{ label: string; value: string | number }> {
  if (step.kind === "precondition-failed") {
    return [{ label: "Status", value: "Precondition failed" }];
  }

  if (step.kind === "complete" && "iterations" in step) {
    return [
      { label: "Comparisons", value: step.comparisons },
      { label: "Shifts", value: step.shifts },
      { label: "Iteration", value: step.iterations },
    ];
  }

  if ("comparisons" in step && !("pass" in step) && !("iteration" in step)) {
    if (step.kind === "not-found" && !("low" in step)) {
      return [{ label: "Comparisons", value: step.comparisons }];
    }
    if ("low" in step) {
      return [
        { label: "Comparisons", value: step.comparisons },
        {
          label: "Range",
          value:
            step.kind === "not-found"
              ? "empty"
              : `${step.low}–${step.high}`,
        },
      ];
    }
    return [{ label: "Comparisons", value: step.comparisons }];
  }

  if ("pass" in step) {
    return [
      { label: "Comparisons", value: step.comparisons },
      { label: "Swaps", value: step.swaps },
      { label: "Pass", value: step.pass },
    ];
  }

  if ("iteration" in step) {
    return [
      { label: "Comparisons", value: step.comparisons },
      { label: "Shifts", value: step.shifts },
      { label: "Iteration", value: step.iteration },
    ];
  }

  return [];
}
