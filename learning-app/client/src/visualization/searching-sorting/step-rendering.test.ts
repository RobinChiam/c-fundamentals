import { describe, expect, it } from "vitest";
import { createBubbleSortTrace } from "./bubble-sort";
import { createInsertionSortTrace } from "./insertion-sort";
import { stepToArrayCells } from "./step-rendering";
import type { InsertionSortStep } from "./trace-types";

describe("stepToArrayCells bubble sort rendering", () => {
  it("does not mark sorted suffix during compare steps", () => {
    const trace = createBubbleSortTrace([3, 1, 2], "ascending");
    const compareStep = trace.steps.find((step) => step.kind === "compare");
    expect(compareStep).toBeDefined();

    const cells = stepToArrayCells(compareStep!);
    expect(cells.some((cell) => cell.role === "sorted")).toBe(false);
    expect(cells.some((cell) => cell.role === "comparing")).toBe(true);
  });

  it("marks sorted suffix only after pass completes", () => {
    const trace = createBubbleSortTrace([3, 1, 2], "ascending");
    const passComplete = trace.steps.find((step) => step.kind === "pass-complete");
    expect(passComplete).toBeDefined();

    const cells = stepToArrayCells(passComplete!);
    expect(cells.filter((cell) => cell.role === "sorted").length).toBeGreaterThan(0);
  });

  it("marks every cell sorted on early exit", () => {
    const trace = createBubbleSortTrace([1, 2, 3], "ascending");
    const earlyExit = trace.steps.find((step) => step.kind === "early-exit");
    expect(earlyExit).toBeDefined();

    const cells = stepToArrayCells(earlyExit!);
    expect(cells.every((cell) => cell.role === "sorted")).toBe(true);
  });
});

describe("stepToArrayCells insertion sort rendering", () => {
  it("does not label overwritten cells as Key during shift steps", () => {
    const trace = createInsertionSortTrace([7, 19, 42, 3, 11], "ascending");
    const shiftStep = trace.steps.find(
      (step) => step.kind === "shift" && step.keyValue === 3,
    );
    expect(shiftStep).toBeDefined();

    const cells = stepToArrayCells(shiftStep!);
    expect(cells.some((cell) => cell.role === "key")).toBe(false);
    expect(cells.filter((cell) => cell.label === "Shift").length).toBe(2);
  });

  it("keeps Insert highlight distinct from sorted prefix", () => {
    const trace = createInsertionSortTrace([7, 19, 42, 3, 11], "ascending");
    const insertStep = trace.steps.find(
      (step): step is Extract<InsertionSortStep, { kind: "insert" }> =>
        step.kind === "insert" && step.keyValue === 3,
    );
    expect(insertStep).toBeDefined();

    const cells = stepToArrayCells(insertStep!);
    const insertCell = cells.find((cell) => cell.index === insertStep!.insertIndex);
    expect(insertCell?.role).toBe("active");
    expect(insertCell?.label).toBe("Insert");
    expect(cells.some((cell) => cell.role === "sorted")).toBe(true);
  });
});
