import { describe, expect, it } from "vitest";
import {
  createFactorialTrace,
  createFunctionTrace,
  createPassByValueTrace,
} from "./function-traces";

describe("function-traces pass-by-value", () => {
  it("starts caller original at 100", () => {
    const trace = createPassByValueTrace();
    expect(trace.steps[0]!.callerVars.find((variable) => variable.name === "original")?.value).toBe(
      100,
    );
  });

  it("callee receives value 100", () => {
    const trace = createPassByValueTrace();
    const callStep = trace.steps.find((step) => step.kind === "call")!;
    const callee = callStep.frames.find((frame) => frame.functionName === "try_modify_copy")!;
    expect(callee.locals.find((local) => local.name === "value")?.value).toBe(100);
  });

  it("changing parameter to 999 leaves caller 100", () => {
    const trace = createPassByValueTrace();
    const assignStep = trace.steps.find((step) => step.kind === "assign-local")!;
    const callee = assignStep.frames.find((frame) => frame.functionName === "try_modify_copy")!;
    expect(callee.locals.find((local) => local.name === "value")?.value).toBe(999);
    expect(assignStep.callerVars.find((variable) => variable.name === "original")?.value).toBe(
      100,
    );
    expect(trace.result).toEqual({ finalOriginal: 100 });
  });

  it("callee frame appears on call", () => {
    const trace = createPassByValueTrace();
    const callStep = trace.steps.find((step) => step.kind === "call")!;
    expect(callStep.frames.some((frame) => frame.functionName === "try_modify_copy")).toBe(true);
  });

  it("callee frame removed on return", () => {
    const trace = createPassByValueTrace();
    const popStep = trace.steps.find((step) => step.kind === "pop")!;
    expect(popStep.frames.some((frame) => frame.functionName === "try_modify_copy")).toBe(false);
  });
});

describe("function-traces factorial", () => {
  it("factorial 4 produces 24", () => {
    const trace = createFactorialTrace(4);
    expect(trace.result).toEqual({ n: 4, result: 24 });
  });

  it("factorial pushes expected conceptual frames", () => {
    const trace = createFactorialTrace(4);
    const callSteps = trace.steps.filter((step) => step.kind === "call");
    expect(callSteps.length).toBe(4);
    expect(callSteps[0]!.metrics.currentDepth).toBe(1);
    expect(callSteps[3]!.metrics.currentDepth).toBe(4);
  });

  it("base case represented", () => {
    const trace = createFactorialTrace(4);
    expect(trace.steps.some((step) => step.kind === "base-case")).toBe(true);
  });

  it("returns propagate correctly", () => {
    const trace = createFactorialTrace(4);
    const returnSteps = trace.steps.filter((step) => step.kind === "return");
    expect(returnSteps.length).toBeGreaterThan(0);
    expect(returnSteps.some((step) => step.frames.some((frame) => frame.returnValue === 24))).toBe(
      true,
    );
  });

  it("maximum depth correct", () => {
    const trace = createFactorialTrace(4);
    const maxDepth = Math.max(...trace.steps.map((step) => step.metrics.maxDepth));
    expect(maxDepth).toBe(4);
  });

  it("factorial 0 handled correctly", () => {
    const trace = createFactorialTrace(0);
    expect(trace.result).toEqual({ n: 0, result: 1 });
    expect(trace.steps.some((step) => step.narration.includes("0! = 1"))).toBe(true);
  });

  it("source inputs not mutated via createFunctionTrace", () => {
    const n = 4;
    createFunctionTrace("recursive-factorial", n);
    expect(n).toBe(4);
  });
});
