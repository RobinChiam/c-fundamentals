import type { VisualizationTrace } from "../core/visualization-types";

export type ControlFlowScenarioId =
  | "for-loop"
  | "sentinel-while"
  | "continue"
  | "do-while"
  | "off-by-one";

export type FlowNodeKind =
  | "init"
  | "condition"
  | "body"
  | "update"
  | "continue"
  | "break"
  | "exit"
  | "input";

export interface FlowNode {
  id: string;
  kind: FlowNodeKind;
  label: string;
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface ControlFlowState {
  i?: number;
  count?: number;
  sum?: number;
  currentInput?: number;
  inputs?: number[];
  inputIndex?: number;
  validIndices?: number[];
  invalidIndex?: number;
}

export interface ControlFlowStep {
  kind: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  activeNodeId: string;
  activeEdgeId: string | null;
  state: ControlFlowState;
  narration: string;
  stopped?: boolean;
}

export interface ControlFlowResult {
  scenarioId: ControlFlowScenarioId;
  finalCount?: number;
  finalSum?: number;
}

export const CONTROL_FLOW_SCENARIO_OPTIONS: {
  id: ControlFlowScenarioId;
  label: string;
}[] = [
  { id: "for-loop", label: "for loop" },
  { id: "sentinel-while", label: "Sentinel while loop" },
  { id: "continue", label: "continue" },
  { id: "do-while", label: "do-while" },
  { id: "off-by-one", label: "Off-by-one comparison" },
];

const FOR_NODES: FlowNode[] = [
  { id: "init", kind: "init", label: "init: i = 0" },
  { id: "condition", kind: "condition", label: "condition: i < 3" },
  { id: "body", kind: "body", label: "body" },
  { id: "update", kind: "update", label: "update: i++" },
  { id: "exit", kind: "exit", label: "exit" },
];

const FOR_EDGES: FlowEdge[] = [
  { id: "init-cond", from: "init", to: "condition", label: "enter loop" },
  { id: "cond-body", from: "condition", to: "body", label: "true" },
  { id: "cond-exit", from: "condition", to: "exit", label: "false" },
  { id: "body-update", from: "body", to: "update" },
  { id: "update-cond", from: "update", to: "condition" },
];

export function createForLoopTrace(): VisualizationTrace<
  ControlFlowStep,
  ControlFlowResult
> {
  const steps: ControlFlowStep[] = [
    {
      kind: "init",
      nodes: FOR_NODES,
      edges: FOR_EDGES,
      activeNodeId: "init",
      activeEdgeId: null,
      state: { i: 0 },
      narration: "for (i = 0; i < 3; i++) — initialization: i is set to 0.",
    },
    {
      kind: "condition-true-0",
      nodes: FOR_NODES,
      edges: FOR_EDGES,
      activeNodeId: "condition",
      activeEdgeId: "init-cond",
      state: { i: 0 },
      narration: "Condition i < 3 is true (0 < 3). Body will execute.",
    },
    {
      kind: "body-0",
      nodes: FOR_NODES,
      edges: FOR_EDGES,
      activeNodeId: "body",
      activeEdgeId: "cond-body",
      state: { i: 0 },
      narration: "Body executes with i = 0.",
    },
    {
      kind: "update-0",
      nodes: FOR_NODES,
      edges: FOR_EDGES,
      activeNodeId: "update",
      activeEdgeId: "body-update",
      state: { i: 0 },
      narration: "Update expression: i++ (i becomes 1 after this step).",
    },
    {
      kind: "condition-true-1",
      nodes: FOR_NODES,
      edges: FOR_EDGES,
      activeNodeId: "condition",
      activeEdgeId: "update-cond",
      state: { i: 1 },
      narration: "Condition i < 3 is true (1 < 3).",
    },
    {
      kind: "body-1",
      nodes: FOR_NODES,
      edges: FOR_EDGES,
      activeNodeId: "body",
      activeEdgeId: "cond-body",
      state: { i: 1 },
      narration: "Body executes with i = 1.",
    },
    {
      kind: "update-1",
      nodes: FOR_NODES,
      edges: FOR_EDGES,
      activeNodeId: "update",
      activeEdgeId: "body-update",
      state: { i: 1 },
      narration: "Update: i++ (i becomes 2).",
    },
    {
      kind: "condition-true-2",
      nodes: FOR_NODES,
      edges: FOR_EDGES,
      activeNodeId: "condition",
      activeEdgeId: "update-cond",
      state: { i: 2 },
      narration: "Condition i < 3 is true (2 < 3).",
    },
    {
      kind: "body-2",
      nodes: FOR_NODES,
      edges: FOR_EDGES,
      activeNodeId: "body",
      activeEdgeId: "cond-body",
      state: { i: 2 },
      narration: "Body executes with i = 2.",
    },
    {
      kind: "update-2",
      nodes: FOR_NODES,
      edges: FOR_EDGES,
      activeNodeId: "update",
      activeEdgeId: "body-update",
      state: { i: 2 },
      narration: "Update: i++ (i becomes 3).",
    },
    {
      kind: "condition-false",
      nodes: FOR_NODES,
      edges: FOR_EDGES,
      activeNodeId: "condition",
      activeEdgeId: "update-cond",
      state: { i: 3 },
      narration: "Condition i < 3 is false (3 < 3). Loop exits without another body execution.",
    },
    {
      kind: "exit",
      nodes: FOR_NODES,
      edges: FOR_EDGES,
      activeNodeId: "exit",
      activeEdgeId: "cond-exit",
      state: { i: 3 },
      narration: "Exit loop. Valid iterations used i = 0, 1, 2.",
    },
  ];

  return { algorithmId: "for-loop", steps, result: { scenarioId: "for-loop" } };
}

const WHILE_NODES: FlowNode[] = [
  { id: "input", kind: "input", label: "read input" },
  { id: "condition", kind: "condition", label: "input != -999" },
  { id: "body", kind: "body", label: "accumulate" },
  { id: "exit", kind: "exit", label: "exit" },
];

const WHILE_EDGES: FlowEdge[] = [
  { id: "input-cond", from: "input", to: "condition" },
  { id: "cond-body", from: "condition", to: "body", label: "true" },
  { id: "cond-exit", from: "condition", to: "exit", label: "false" },
  { id: "body-input", from: "body", to: "input" },
];

export function createSentinelWhileTrace(): VisualizationTrace<
  ControlFlowStep,
  ControlFlowResult
> {
  const inputs = [10, 20, -999];
  const steps: ControlFlowStep[] = [];
  let count = 0;
  let sum = 0;

  const push = (step: ControlFlowStep) => steps.push(step);

  push({
    kind: "setup",
    nodes: WHILE_NODES,
    edges: WHILE_EDGES,
    activeNodeId: "input",
    activeEdgeId: null,
    state: { count, sum, inputs, inputIndex: 0 },
    narration: "Sentinel loop: read values until -999. Sentinel is not accumulated.",
  });

  for (let index = 0; index < inputs.length; index += 1) {
    const input = inputs[index]!;
    push({
      kind: "read",
      nodes: WHILE_NODES,
      edges: WHILE_EDGES,
      activeNodeId: "input",
      activeEdgeId: index === 0 ? null : "body-input",
      state: { count, sum, currentInput: input, inputs, inputIndex: index },
      narration: `Read input: ${input}.`,
    });

    const isSentinel = input === -999;
    push({
      kind: "condition",
      nodes: WHILE_NODES,
      edges: WHILE_EDGES,
      activeNodeId: "condition",
      activeEdgeId: "input-cond",
      state: { count, sum, currentInput: input, inputs, inputIndex: index },
      narration: isSentinel
        ? "Condition input != -999 is false. Sentinel recognized — exit without counting."
        : "Condition input != -999 is true.",
    });

    if (isSentinel) {
      push({
        kind: "exit",
        nodes: WHILE_NODES,
        edges: WHILE_EDGES,
        activeNodeId: "exit",
        activeEdgeId: "cond-exit",
        state: { count, sum, currentInput: input, inputs, inputIndex: index },
        narration: `Break/exit. Final count = ${count}, sum = ${sum}. Sentinel -999 was not accumulated.`,
      });
      break;
    }

    count += 1;
    sum += input;
    push({
      kind: "body",
      nodes: WHILE_NODES,
      edges: WHILE_EDGES,
      activeNodeId: "body",
      activeEdgeId: "cond-body",
      state: { count, sum, currentInput: input, inputs, inputIndex: index },
      narration: `Accumulate: count = ${count}, sum = ${sum}.`,
    });
  }

  return {
    algorithmId: "sentinel-while",
    steps,
    result: { scenarioId: "sentinel-while", finalCount: 2, finalSum: 30 },
  };
}

const CONTINUE_NODES: FlowNode[] = [
  { id: "init", kind: "init", label: "init: i = 1" },
  { id: "condition", kind: "condition", label: "i <= 10" },
  { id: "body", kind: "body", label: "skip multiples of 3" },
  { id: "continue", kind: "continue", label: "continue" },
  { id: "update", kind: "update", label: "update: i++" },
  { id: "exit", kind: "exit", label: "exit" },
];

const CONTINUE_EDGES: FlowEdge[] = [
  { id: "init-cond", from: "init", to: "condition" },
  { id: "cond-body", from: "condition", to: "body", label: "true" },
  { id: "cond-exit", from: "condition", to: "exit", label: "false" },
  { id: "body-update", from: "body", to: "update", label: "process" },
  { id: "body-continue", from: "body", to: "continue", label: "skip" },
  { id: "continue-update", from: "continue", to: "update" },
  { id: "update-cond", from: "update", to: "condition" },
];

export function createContinueTrace(): VisualizationTrace<
  ControlFlowStep,
  ControlFlowResult
> {
  const steps: ControlFlowStep[] = [
    {
      kind: "init",
      nodes: CONTINUE_NODES,
      edges: CONTINUE_EDGES,
      activeNodeId: "init",
      activeEdgeId: null,
      state: { i: 1 },
      narration: "for (i = 1; i <= 10; i++) — skip multiples of 3 using continue.",
    },
    {
      kind: "cond-3",
      nodes: CONTINUE_NODES,
      edges: CONTINUE_EDGES,
      activeNodeId: "condition",
      activeEdgeId: "init-cond",
      state: { i: 3 },
      narration: "i = 3: condition true, body detects multiple of 3.",
    },
    {
      kind: "continue-3",
      nodes: CONTINUE_NODES,
      edges: CONTINUE_EDGES,
      activeNodeId: "continue",
      activeEdgeId: "body-continue",
      state: { i: 3 },
      narration:
        "continue skips the remaining body and proceeds to the for-loop update expression (not back to body directly).",
    },
    {
      kind: "update-3",
      nodes: CONTINUE_NODES,
      edges: CONTINUE_EDGES,
      activeNodeId: "update",
      activeEdgeId: "continue-update",
      state: { i: 3 },
      narration: "Update: i++ (i becomes 4).",
    },
    {
      kind: "cond-4",
      nodes: CONTINUE_NODES,
      edges: CONTINUE_EDGES,
      activeNodeId: "condition",
      activeEdgeId: "update-cond",
      state: { i: 4 },
      narration: "Condition re-evaluated: i = 4, not a multiple of 3 — normal body path.",
    },
    {
      kind: "body-4",
      nodes: CONTINUE_NODES,
      edges: CONTINUE_EDGES,
      activeNodeId: "body",
      activeEdgeId: "cond-body",
      state: { i: 4 },
      narration: "Body processes i = 4 normally (no continue).",
    },
  ];

  return { algorithmId: "continue", steps, result: { scenarioId: "continue" } };
}

const DO_WHILE_NODES: FlowNode[] = [
  { id: "body", kind: "body", label: "body" },
  { id: "condition", kind: "condition", label: "condition" },
  { id: "exit", kind: "exit", label: "exit" },
];

const DO_WHILE_EDGES: FlowEdge[] = [
  { id: "body-cond", from: "body", to: "condition" },
  { id: "cond-body", from: "condition", to: "body", label: "true" },
  { id: "cond-exit", from: "condition", to: "exit", label: "false" },
];

export function createDoWhileTrace(): VisualizationTrace<
  ControlFlowStep,
  ControlFlowResult
> {
  const steps: ControlFlowStep[] = [
    {
      kind: "body-first",
      nodes: DO_WHILE_NODES,
      edges: DO_WHILE_EDGES,
      activeNodeId: "body",
      activeEdgeId: null,
      state: { i: 0 },
      narration:
        "do { ... } while (...): body executes BEFORE the first condition evaluation. Contrast with while, which tests first.",
    },
    {
      kind: "condition-false",
      nodes: DO_WHILE_NODES,
      edges: DO_WHILE_EDGES,
      activeNodeId: "condition",
      activeEdgeId: "body-cond",
      state: { i: 0 },
      narration: "After body, condition is evaluated. If false, exit.",
    },
    {
      kind: "exit",
      nodes: DO_WHILE_NODES,
      edges: DO_WHILE_EDGES,
      activeNodeId: "exit",
      activeEdgeId: "cond-exit",
      state: { i: 0 },
      narration: "Loop exits. do-while guarantees at least one body execution.",
    },
  ];

  return { algorithmId: "do-while", steps, result: { scenarioId: "do-while" } };
}

export function createOffByOneTrace(): VisualizationTrace<
  ControlFlowStep,
  ControlFlowResult
> {
  const n = 3;
  const correctNodes: FlowNode[] = [
    { id: "init", kind: "init", label: "init: i = 0" },
    { id: "condition", kind: "condition", label: "i < n (correct)" },
    { id: "body", kind: "body", label: "access values[i]" },
    { id: "update", kind: "update", label: "i++" },
    { id: "exit", kind: "exit", label: "exit" },
  ];
  const correctEdges: FlowEdge[] = [
    { id: "init-cond", from: "init", to: "condition" },
    { id: "cond-body", from: "condition", to: "body", label: "true" },
    { id: "cond-exit", from: "condition", to: "exit", label: "false" },
    { id: "body-update", from: "body", to: "update" },
    { id: "update-cond", from: "update", to: "condition" },
  ];

  const buggyNodes: FlowNode[] = [
    { id: "init", kind: "init", label: "init: i = 0" },
    { id: "condition", kind: "condition", label: "i <= n (bug)" },
    { id: "body", kind: "body", label: "access values[i]" },
    { id: "update", kind: "update", label: "i++" },
    { id: "exit", kind: "exit", label: "stop" },
  ];

  const steps: ControlFlowStep[] = [
    {
      kind: "correct-summary",
      nodes: correctNodes,
      edges: correctEdges,
      activeNodeId: "exit",
      activeEdgeId: "cond-exit",
      state: { i: 3, validIndices: [0, 1, 2] },
      narration: `Correct loop i < ${n} visits valid indices 0, 1, 2 then exits when i = ${n}.`,
    },
    {
      kind: "buggy-reach",
      nodes: buggyNodes,
      edges: correctEdges,
      activeNodeId: "body",
      activeEdgeId: "cond-body",
      state: { i: 3, validIndices: [0, 1, 2], invalidIndex: 3 },
      stopped: true,
      narration: `Buggy loop i <= ${n} reaches i = 3. Index 3 is outside the valid range [0..${n - 1}]. Simulation stops before fabricating a memory read.`,
    },
  ];

  return { algorithmId: "off-by-one", steps, result: { scenarioId: "off-by-one" } };
}

export function createWhileZeroIterationsTrace(): VisualizationTrace<
  ControlFlowStep,
  ControlFlowResult
> {
  const nodes: FlowNode[] = [
    { id: "condition", kind: "condition", label: "condition false" },
    { id: "body", kind: "body", label: "body (skipped)" },
    { id: "exit", kind: "exit", label: "exit" },
  ];
  const edges: FlowEdge[] = [
    { id: "cond-body", from: "condition", to: "body", label: "true" },
    { id: "cond-exit", from: "condition", to: "exit", label: "false" },
  ];
  const steps: ControlFlowStep[] = [
    {
      kind: "while-zero",
      nodes,
      edges,
      activeNodeId: "condition",
      activeEdgeId: null,
      state: {},
      narration: "while loop: condition evaluated first. When false initially, body never runs (zero iterations).",
    },
    {
      kind: "while-zero-exit",
      nodes,
      edges,
      activeNodeId: "exit",
      activeEdgeId: "cond-exit",
      state: {},
      narration: "Exit immediately — zero iterations.",
    },
  ];
  return { algorithmId: "while-zero", steps, result: { scenarioId: "for-loop" } };
}

export function createControlFlowTrace(
  scenarioId: ControlFlowScenarioId,
): VisualizationTrace<ControlFlowStep, ControlFlowResult> {
  switch (scenarioId) {
    case "for-loop":
      return createForLoopTrace();
    case "sentinel-while":
      return createSentinelWhileTrace();
    case "continue":
      return createContinueTrace();
    case "do-while":
      return createDoWhileTrace();
    case "off-by-one":
      return createOffByOneTrace();
  }
}

export function controlFlowStepMetrics(
  step: ControlFlowStep,
): { label: string; value: string | number }[] {
  const metrics: { label: string; value: string | number }[] = [];
  if (step.state.i !== undefined) metrics.push({ label: "i", value: step.state.i });
  if (step.state.count !== undefined)
    metrics.push({ label: "count", value: step.state.count });
  if (step.state.sum !== undefined) metrics.push({ label: "sum", value: step.state.sum });
  if (step.state.currentInput !== undefined)
    metrics.push({ label: "current input", value: step.state.currentInput });
  return metrics;
}
