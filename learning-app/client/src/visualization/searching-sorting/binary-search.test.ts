import { describe, expect, it } from "vitest";
import { createBinarySearchTrace } from "./binary-search";

describe("createBinarySearchTrace", () => {
  it("finds target", () => {
    const trace = createBinarySearchTrace([3, 7, 11, 19, 42, 42], 19);
    expect(trace.result.foundIndex).toBe(3);
    expect(trace.result.preconditionFailed).toBe(false);
  });

  it("reports target absent", () => {
    const trace = createBinarySearchTrace([1, 2, 4, 8], 3);
    expect(trace.result.foundIndex).toBeNull();
  });

  it("handles one element", () => {
    expect(createBinarySearchTrace([5], 5).result.foundIndex).toBe(0);
    expect(createBinarySearchTrace([5], 2).result.foundIndex).toBeNull();
  });

  it("handles empty input", () => {
    const trace = createBinarySearchTrace([], 1);
    expect(trace.result.foundIndex).toBeNull();
    expect(trace.result.comparisons).toBe(0);
  });

  it("handles target below range", () => {
    const trace = createBinarySearchTrace([10, 20, 30], 1);
    expect(trace.result.foundIndex).toBeNull();
  });

  it("handles target above range", () => {
    const trace = createBinarySearchTrace([10, 20, 30], 99);
    expect(trace.result.foundIndex).toBeNull();
  });

  it("handles duplicates with valid matching index", () => {
    const trace = createBinarySearchTrace([3, 7, 11, 19, 42, 42], 42);
    expect(trace.result.foundIndex).not.toBeNull();
    expect([4, 5]).toContain(trace.result.foundIndex);
  });

  it("shrinks search range correctly", () => {
    const trace = createBinarySearchTrace([3, 7, 11, 19, 42, 42], 19);
    const checks = trace.steps.filter((step) => step.kind === "check");
    expect(checks.length).toBeGreaterThan(0);
    for (const step of checks) {
      expect(step.mid).toBeGreaterThanOrEqual(step.low);
      expect(step.mid).toBeLessThanOrEqual(step.high);
    }
  });

  it("keeps midpoint in active range", () => {
    const trace = createBinarySearchTrace([1, 2, 3, 4, 5, 6, 7, 8], 7);
    for (const step of trace.steps) {
      if (step.kind === "check" || step.kind === "found") {
        expect(step.mid).toBeGreaterThanOrEqual(step.low);
        expect(step.mid).toBeLessThanOrEqual(step.high);
      }
    }
  });

  it("matches comparison count to checks", () => {
    const trace = createBinarySearchTrace([3, 7, 11, 19, 42, 42], 19);
    const checks = trace.steps.filter(
      (step) => step.kind === "check" || step.kind === "found",
    );
    expect(trace.result.comparisons).toBe(checks.length);
  });

  it("rejects unsorted input with precondition state", () => {
    const trace = createBinarySearchTrace([42, 7, 19, 3], 19);
    expect(trace.result.preconditionFailed).toBe(true);
    expect(trace.steps[0]?.kind).toBe("precondition-failed");
  });

  it("does not silently sort input", () => {
    const input = [42, 7, 19, 3];
    const trace = createBinarySearchTrace(input, 19);
    expect(trace.result.preconditionFailed).toBe(true);
    expect(trace.steps[0]?.values).toEqual([42, 7, 19, 3]);
  });

  it("does not mutate input array", () => {
    const input = [3, 7, 11, 19];
    createBinarySearchTrace(input, 19);
    expect(input).toEqual([3, 7, 11, 19]);
  });
});
