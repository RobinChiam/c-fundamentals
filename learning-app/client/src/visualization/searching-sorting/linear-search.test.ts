import { describe, expect, it } from "vitest";
import { createLinearSearchTrace } from "./linear-search";

describe("createLinearSearchTrace", () => {
  it("finds target", () => {
    const trace = createLinearSearchTrace([42, 7, 19, 3, 42, 11], 19);
    expect(trace.result.foundIndex).toBe(2);
  });

  it("reports not found", () => {
    const trace = createLinearSearchTrace([1, 2, 3], 99);
    expect(trace.result.foundIndex).toBeNull();
    expect(trace.steps.at(-1)?.kind).toBe("not-found");
  });

  it("returns first match for duplicates", () => {
    const trace = createLinearSearchTrace([42, 7, 19, 3, 42, 11], 42);
    expect(trace.result.foundIndex).toBe(0);
  });

  it("checks indices sequentially", () => {
    const trace = createLinearSearchTrace([10, 20, 30], 30);
    const checkIndices = trace.steps
      .filter((step) => step.kind === "check")
      .map((step) => step.index);
    expect(checkIndices).toEqual([0, 1]);
  });

  it("counts comparisons correctly", () => {
    const trace = createLinearSearchTrace([42, 7, 19, 3, 42, 11], 19);
    expect(trace.result.comparisons).toBe(3);
  });

  it("handles empty input", () => {
    const trace = createLinearSearchTrace([], 19);
    expect(trace.result.foundIndex).toBeNull();
    expect(trace.result.comparisons).toBe(0);
  });

  it("handles one-element found", () => {
    const trace = createLinearSearchTrace([5], 5);
    expect(trace.result.foundIndex).toBe(0);
  });

  it("does not mutate input array", () => {
    const input = [42, 7, 19];
    createLinearSearchTrace(input, 19);
    expect(input).toEqual([42, 7, 19]);
  });
});
