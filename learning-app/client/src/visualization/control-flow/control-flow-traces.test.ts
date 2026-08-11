import { describe, expect, it } from "vitest";
import {
  createContinueTrace,
  createControlFlowTrace,
  createDoWhileTrace,
  createForLoopTrace,
  createOffByOneTrace,
  createSentinelWhileTrace,
  createWhileZeroIterationsTrace,
} from "./control-flow-traces";

describe("control-flow for loop", () => {
  it("starts with initialization", () => {
    const trace = createForLoopTrace();
    expect(trace.steps[0]!.activeNodeId).toBe("init");
  });

  it("condition evaluated before first body", () => {
    const trace = createForLoopTrace();
    const firstCond = trace.steps.find((step) => step.activeNodeId === "condition")!;
    const firstBody = trace.steps.find((step) => step.activeNodeId === "body")!;
    expect(trace.steps.indexOf(firstCond)).toBeLessThan(trace.steps.indexOf(firstBody));
  });

  it("body executes only on true condition", () => {
    const trace = createForLoopTrace();
    const falseCond = trace.steps.find((step) => step.kind === "condition-false")!;
    expect(trace.steps.indexOf(falseCond)).toBeLessThan(
      trace.steps.findIndex((step) => step.activeNodeId === "exit"),
    );
  });

  it("update follows normal body", () => {
    const trace = createForLoopTrace();
    const body0 = trace.steps.find((step) => step.kind === "body-0")!;
    const update0 = trace.steps.find((step) => step.kind === "update-0")!;
    expect(trace.steps.indexOf(body0)).toBeLessThan(trace.steps.indexOf(update0));
  });

  it("false condition exits", () => {
    const trace = createForLoopTrace();
    expect(trace.steps.at(-1)!.activeNodeId).toBe("exit");
  });
});

describe("control-flow while/do-while", () => {
  it("while can perform zero iterations", () => {
    const trace = createWhileZeroIterationsTrace();
    expect(trace.steps.some((step) => step.activeNodeId === "body")).toBe(false);
    expect(trace.steps.at(-1)!.activeNodeId).toBe("exit");
  });

  it("sentinel -999 excluded from aggregation", () => {
    const trace = createSentinelWhileTrace();
    expect(trace.result.finalCount).toBe(2);
    expect(trace.result.finalSum).toBe(30);
  });

  it("do-while performs body before condition", () => {
    const trace = createDoWhileTrace();
    expect(trace.steps[0]!.activeNodeId).toBe("body");
    expect(trace.steps[1]!.activeNodeId).toBe("condition");
  });
  it("break exits sentinel loop", () => {
    const trace = createSentinelWhileTrace();
    const exitStep = trace.steps.find((step) => step.activeNodeId === "exit")!;
    expect(exitStep.narration).toMatch(/exit|sentinel/i);
  });
});

describe("control-flow continue", () => {
  it("continue skips remaining body", () => {
    const trace = createContinueTrace();
    const continueStep = trace.steps.find((step) => step.activeNodeId === "continue")!;
    expect(continueStep.narration).toMatch(/skips the remaining body/i);
  });

  it("for-loop continue proceeds to update", () => {
    const trace = createContinueTrace();
    const continueStep = trace.steps.find((step) => step.activeNodeId === "continue")!;
    const updateStep = trace.steps.find((step) => step.kind === "update-3")!;
    expect(trace.steps.indexOf(continueStep)).toBeLessThan(trace.steps.indexOf(updateStep));
    expect(updateStep.activeEdgeId).toBe("continue-update");
  });

  it("continue eventually returns to condition", () => {
    const trace = createContinueTrace();
    const updateStep = trace.steps.find((step) => step.kind === "update-3")!;
    const condStep = trace.steps.find((step) => step.kind === "cond-4")!;
    expect(trace.steps.indexOf(updateStep)).toBeLessThan(trace.steps.indexOf(condStep));
  });
});

describe("control-flow off-by-one", () => {
  it("correct loop visits 0..n-1", () => {
    const trace = createOffByOneTrace();
    const step = trace.steps[0]!;
    expect(step.state.validIndices).toEqual([0, 1, 2]);
  });

  it("buggy <= reaches index n", () => {
    const trace = createOffByOneTrace();
    const step = trace.steps[1]!;
    expect(step.state.i).toBe(3);
    expect(step.state.invalidIndex).toBe(3);
  });

  it("invalid index is not dereferenced", () => {
    const trace = createOffByOneTrace();
    const step = trace.steps[1]!;
    expect(step.stopped).toBe(true);
    expect(step.narration).toMatch(/stops before fabricating/i);
  });

  it("flow narration matches transitions", () => {
    const trace = createForLoopTrace();
    for (const step of trace.steps) {
      expect(step.narration.length).toBeGreaterThan(0);
      expect(step.activeNodeId).toBeTruthy();
    }
  });

  it("createControlFlowTrace does not mutate scenario id", () => {
    const id = "for-loop" as const;
    createControlFlowTrace(id);
    expect(id).toBe("for-loop");
  });
});
