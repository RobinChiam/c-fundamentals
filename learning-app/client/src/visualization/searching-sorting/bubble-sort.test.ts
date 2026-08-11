import { describe, expect, it } from "vitest";
import { createBubbleSortTrace } from "./bubble-sort";

describe("createBubbleSortTrace", () => {
  it("sorts ascending", () => {
    const trace = createBubbleSortTrace([3, 1, 2], "ascending");
    expect(trace.result.sortedValues).toEqual([1, 2, 3]);
  });

  it("sorts descending", () => {
    const trace = createBubbleSortTrace([3, 1, 2], "descending");
    expect(trace.result.sortedValues).toEqual([3, 2, 1]);
  });

  it("handles duplicate values", () => {
    const trace = createBubbleSortTrace([2, 1, 2, 1], "ascending");
    expect(trace.result.sortedValues).toEqual([1, 1, 2, 2]);
  });

  it("handles negative values", () => {
    const trace = createBubbleSortTrace([-3, -1, -2], "ascending");
    expect(trace.result.sortedValues).toEqual([-3, -2, -1]);
  });

  it("early exits on already sorted input", () => {
    const trace = createBubbleSortTrace([1, 2, 3], "ascending");
    expect(trace.steps.some((step) => step.kind === "early-exit")).toBe(true);
  });

  it("sorts reverse-sorted input", () => {
    const trace = createBubbleSortTrace([3, 2, 1], "ascending");
    expect(trace.result.sortedValues).toEqual([1, 2, 3]);
  });

  it("only swaps adjacent indices", () => {
    const trace = createBubbleSortTrace([3, 1, 2], "ascending");
    const swaps = trace.steps.filter((step) => step.kind === "swap");
    for (const step of swaps) {
      expect(step.rightIndex - step.leftIndex).toBe(1);
    }
  });

  it("has deterministic comparison counter", () => {
    const first = createBubbleSortTrace([3, 1, 2], "ascending");
    const second = createBubbleSortTrace([3, 1, 2], "ascending");
    expect(first.result.comparisons).toBe(second.result.comparisons);
  });

  it("has deterministic swap counter", () => {
    const first = createBubbleSortTrace([3, 1, 2], "ascending");
    const second = createBubbleSortTrace([3, 1, 2], "ascending");
    expect(first.result.swaps).toBe(second.result.swaps);
  });

  it("records pass states", () => {
    const trace = createBubbleSortTrace([3, 1, 2], "ascending");
    expect(trace.steps.some((step) => step.kind === "pass-complete")).toBe(true);
  });

  it("does not mutate input array", () => {
    const input = [3, 1, 2];
    createBubbleSortTrace(input, "ascending");
    expect(input).toEqual([3, 1, 2]);
  });
});
