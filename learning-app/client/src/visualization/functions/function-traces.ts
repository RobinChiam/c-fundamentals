import type { VisualizationTrace } from "../core/visualization-types";

export type FunctionScenarioId = "pass-by-value" | "recursive-factorial";

export interface CallFrameLocal {
  name: string;
  value: number | null;
  label?: string;
}

export interface CallFrame {
  id: string;
  functionName: string;
  locals: CallFrameLocal[];
  status: "active" | "returning" | "returned";
  returnValue?: number;
}

export interface CallerVariable {
  name: string;
  value: number;
}

export interface FunctionMetrics {
  currentDepth: number;
  maxDepth: number;
  callCount: number;
  returnCount: number;
}

export interface FunctionStep {
  kind:
    | "setup"
    | "call"
    | "assign-local"
    | "base-case"
    | "return"
    | "pop"
    | "complete";
  frames: CallFrame[];
  callerVars: CallerVariable[];
  activeFrameId: string | null;
  narration: string;
  metrics: FunctionMetrics;
}

export interface PassByValueResult {
  finalOriginal: number;
}

export interface FactorialResult {
  n: number;
  result: number;
}

export type FunctionTraceResult = PassByValueResult | FactorialResult;

export const FUNCTION_SCENARIO_OPTIONS: {
  id: FunctionScenarioId;
  label: string;
}[] = [
  { id: "pass-by-value", label: "Pass by value" },
  { id: "recursive-factorial", label: "Recursive factorial" },
];

export function createPassByValueTrace(): VisualizationTrace<
  FunctionStep,
  PassByValueResult
> {
  const steps: FunctionStep[] = [
    {
      kind: "setup",
      frames: [],
      callerVars: [{ name: "original", value: 100 }],
      activeFrameId: null,
      narration:
        "In main, original is 100. C passes int arguments by value — the callee will receive a copy.",
      metrics: { currentDepth: 0, maxDepth: 0, callCount: 0, returnCount: 0 },
    },
    {
      kind: "call",
      frames: [
        {
          id: "main",
          functionName: "main",
          locals: [{ name: "original", value: 100 }],
          status: "active",
        },
        {
          id: "try_modify_copy",
          functionName: "try_modify_copy",
          locals: [{ name: "value", value: 100, label: "copy of original" }],
          status: "active",
        },
      ],
      callerVars: [{ name: "original", value: 100 }],
      activeFrameId: "try_modify_copy",
      narration:
        "Calling try_modify_copy(original). A copy of original's value (100) is stored in parameter value. value is local to this call.",
      metrics: { currentDepth: 1, maxDepth: 1, callCount: 1, returnCount: 0 },
    },
    {
      kind: "assign-local",
      frames: [
        {
          id: "main",
          functionName: "main",
          locals: [{ name: "original", value: 100 }],
          status: "active",
        },
        {
          id: "try_modify_copy",
          functionName: "try_modify_copy",
          locals: [{ name: "value", value: 999 }],
          status: "active",
        },
      ],
      callerVars: [{ name: "original", value: 100 }],
      activeFrameId: "try_modify_copy",
      narration:
        "Inside try_modify_copy, value is set to 999. This changes only the callee's local copy, not original in main.",
      metrics: { currentDepth: 1, maxDepth: 1, callCount: 1, returnCount: 0 },
    },
    {
      kind: "return",
      frames: [
        {
          id: "main",
          functionName: "main",
          locals: [{ name: "original", value: 100 }],
          status: "active",
        },
        {
          id: "try_modify_copy",
          functionName: "try_modify_copy",
          locals: [{ name: "value", value: 999 }],
          status: "returning",
        },
      ],
      callerVars: [{ name: "original", value: 100 }],
      activeFrameId: "try_modify_copy",
      narration: "try_modify_copy returns. Control returns to main.",
      metrics: { currentDepth: 1, maxDepth: 1, callCount: 1, returnCount: 0 },
    },
    {
      kind: "pop",
      frames: [
        {
          id: "main",
          functionName: "main",
          locals: [{ name: "original", value: 100 }],
          status: "active",
        },
      ],
      callerVars: [{ name: "original", value: 100 }],
      activeFrameId: "main",
      narration:
        "The conceptual call frame for try_modify_copy is removed. original in main remains 100 — unchanged by the callee.",
      metrics: { currentDepth: 0, maxDepth: 1, callCount: 1, returnCount: 1 },
    },
    {
      kind: "complete",
      frames: [
        {
          id: "main",
          functionName: "main",
          locals: [{ name: "original", value: 100 }],
          status: "active",
        },
      ],
      callerVars: [{ name: "original", value: 100 }],
      activeFrameId: "main",
      narration:
        "Pass-by-value complete: assigning to a scalar parameter does not modify the caller's variable.",
      metrics: { currentDepth: 0, maxDepth: 1, callCount: 1, returnCount: 1 },
    },
  ];

  return {
    algorithmId: "pass-by-value",
    steps,
    result: { finalOriginal: 100 },
  };
}

export function createFactorialTrace(
  n: number,
): VisualizationTrace<FunctionStep, FactorialResult> {
  const bounded = Math.max(0, Math.min(6, n));
  const steps: FunctionStep[] = [];
  let callCount = 0;
  let returnCount = 0;
  let maxDepth = 0;

  const pushStep = (step: FunctionStep) => {
    steps.push(step);
  };

  interface FrameInfo {
    id: string;
    n: number;
  }

  const frameStack: FrameInfo[] = [];

  const buildFrames = (
    activeId: string | null,
    returningId?: string,
    returnValue?: number,
  ): CallFrame[] => {
    return frameStack.map((frame) => ({
      id: frame.id,
      functionName: "factorial",
      locals: [{ name: "n", value: frame.n }],
      status:
        frame.id === returningId
          ? "returning"
          : frame.id === activeId
            ? "active"
            : "active",
      returnValue: frame.id === returningId ? returnValue : undefined,
    }));
  };

  const metrics = (): FunctionMetrics => ({
    currentDepth: frameStack.length,
    maxDepth,
    callCount,
    returnCount,
  });

  pushStep({
    kind: "setup",
    frames: [],
    callerVars: [{ name: "n (input)", value: bounded }],
    activeFrameId: null,
    narration: `Computing factorial(${bounded}) recursively. Each call pushes a conceptual frame until the base case.`,
    metrics: metrics(),
  });

  const callFactorial = (value: number, depth: number): number => {
    const frameId = `factorial-${value}-${depth}`;
    frameStack.push({ id: frameId, n: value });
    callCount += 1;
    maxDepth = Math.max(maxDepth, frameStack.length);

    pushStep({
      kind: "call",
      frames: buildFrames(frameId),
      callerVars: [{ name: "n (input)", value: bounded }],
      activeFrameId: frameId,
      narration: `Call factorial(${value}). Conceptual frame pushed with parameter n = ${value}.`,
      metrics: metrics(),
    });

    if (value <= 1) {
      pushStep({
        kind: "base-case",
        frames: buildFrames(frameId),
        callerVars: [{ name: "n (input)", value: bounded }],
        activeFrameId: frameId,
        narration:
          value === 0
            ? "Base case: n is 0. By definition, 0! = 1."
            : "Base case: n is 1. Returning 1.",
        metrics: metrics(),
      });

      const result = 1;
      pushStep({
        kind: "return",
        frames: buildFrames(frameId, frameId, result),
        callerVars: [{ name: "n (input)", value: bounded }],
        activeFrameId: frameId,
        narration: `factorial(${value}) returns ${result}.`,
        metrics: metrics(),
      });

      frameStack.pop();
      returnCount += 1;
      pushStep({
        kind: "pop",
        frames: buildFrames(frameStack.at(-1)?.id ?? null),
        callerVars: [{ name: "n (input)", value: bounded }],
        activeFrameId: frameStack.at(-1)?.id ?? null,
        narration: `Frame for factorial(${value}) removed. Return value ${result} propagates to caller.`,
        metrics: metrics(),
      });

      return result;
    }

    const subResult = callFactorial(value - 1, depth + 1);
    const result = value * subResult;

    pushStep({
      kind: "return",
      frames: buildFrames(frameId, frameId, result),
      callerVars: [{ name: "n (input)", value: bounded }],
      activeFrameId: frameId,
      narration: `factorial(${value}) computes ${value} × ${subResult} = ${result} and returns.`,
      metrics: metrics(),
    });

    frameStack.pop();
    returnCount += 1;
    pushStep({
      kind: "pop",
      frames: buildFrames(frameStack.at(-1)?.id ?? null),
      callerVars: [{ name: "n (input)", value: bounded }],
      activeFrameId: frameStack.at(-1)?.id ?? null,
      narration: `Frame for factorial(${value}) removed. Return value ${result} propagates to caller.`,
      metrics: metrics(),
    });

    return result;
  };

  const finalResult = callFactorial(bounded, 0);

  pushStep({
    kind: "complete",
    frames: [],
    callerVars: [
      { name: "n (input)", value: bounded },
      { name: "result", value: finalResult },
    ],
    activeFrameId: null,
    narration: `Recursion complete. factorial(${bounded}) = ${finalResult}.`,
    metrics: metrics(),
  });

  return {
    algorithmId: "recursive-factorial",
    steps,
    result: { n: bounded, result: finalResult },
  };
}

export function createFunctionTrace(
  scenarioId: FunctionScenarioId,
  factorialN = 4,
): VisualizationTrace<FunctionStep, FunctionTraceResult> {
  if (scenarioId === "pass-by-value") {
    return createPassByValueTrace();
  }
  return createFactorialTrace(factorialN);
}

export function stepMetrics(step: FunctionStep): { label: string; value: string | number }[] {
  return [
    { label: "Current depth", value: step.metrics.currentDepth },
    { label: "Maximum depth", value: step.metrics.maxDepth },
    { label: "Calls", value: step.metrics.callCount },
    { label: "Returns", value: step.metrics.returnCount },
  ];
}
