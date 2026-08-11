import { describe, expect, it } from "vitest";
import { createInsertionSortTrace } from "./insertion-sort";
import type { SortOrder } from "./trace-types";

function isSorted(values: number[], order: SortOrder): boolean {
  for (let i = 1; i < values.length; i += 1) {
    if (order === "ascending" && values[i]! < values[i - 1]!) {
      return false;
    }
    if (order === "descending" && values[i]! > values[i - 1]!) {
      return false;
    }
  }
  return true;
}

describe("createInsertionSortTrace", () => {
  it("sorts ascending", () => {
    const trace = createInsertionSortTrace([7, 19, 42, 3, 11], "ascending");
    expect(trace.result.sortedValues).toEqual([3, 7, 11, 19, 42]);
  });

  it("sorts descending", () => {
    const trace = createInsertionSortTrace([7, 19, 42, 3, 11], "descending");
    expect(trace.result.sortedValues).toEqual([42, 19, 11, 7, 3]);
  });

  it("handles duplicate values", () => {
    const trace = createInsertionSortTrace([2, 1, 2, 1], "ascending");
    expect(trace.result.sortedValues).toEqual([1, 1, 2, 2]);
  });

  it("handles negative values", () => {
    const trace = createInsertionSortTrace([-1, -3, 0], "ascending");
    expect(trace.result.sortedValues).toEqual([-3, -1, 0]);
  });

  it("handles already sorted input", () => {
    const trace = createInsertionSortTrace([1, 2, 3], "ascending");
    expect(trace.result.sortedValues).toEqual([1, 2, 3]);
  });

  it("handles reverse sorted input", () => {
    const trace = createInsertionSortTrace([3, 2, 1], "ascending");
    expect(trace.result.sortedValues).toEqual([1, 2, 3]);
  });

  it("includes selected-key steps", () => {
    const trace = createInsertionSortTrace([7, 19, 42, 3, 11], "ascending");
    expect(trace.steps.some((step) => step.kind === "select-key")).toBe(true);
  });

  it("records shift steps correctly", () => {
    const trace = createInsertionSortTrace([7, 19, 42, 3, 11], "ascending");
    const shifts = trace.steps.filter((step) => step.kind === "shift");
    expect(shifts.length).toBeGreaterThan(0);
  });

  it("records insertion steps", () => {
    const trace = createInsertionSortTrace([7, 19, 42, 3, 11], "ascending");
    expect(trace.steps.some((step) => step.kind === "insert")).toBe(true);
  });

  it("keeps processed prefix sorted after each iteration", () => {
    const trace = createInsertionSortTrace([7, 19, 42, 3, 11], "ascending");
    const iterationSteps = trace.steps.filter(
      (step) => step.kind === "iteration-complete",
    );
    for (const step of iterationSteps) {
      const prefix = step.values.slice(0, step.iteration + 1);
      expect(isSorted(prefix, "ascending")).toBe(true);
    }
  });

  it("has deterministic metrics", () => {
    const first = createInsertionSortTrace([7, 19, 42, 3, 11], "ascending");
    const second = createInsertionSortTrace([7, 19, 42, 3, 11], "ascending");
    expect(first.result).toEqual(second.result);
  });

  it("does not mutate input array", () => {
    const input = [7, 19, 42, 3, 11];
    createInsertionSortTrace(input, "ascending");
    expect(input).toEqual([7, 19, 42, 3, 11]);
  });
});
