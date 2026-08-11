import type { VisualizationTrace } from "../core/visualization-types";
import type {
  MemoryVariable,
  PointerVariable,
  UndefinedBehaviorState,
} from "../memory/memory-types";

export type PointerScenarioId =
  | "address-dereference"
  | "swap-via-pointers"
  | "array-pointer-walk"
  | "null-dereference";

export interface PointerStep {
  kind: string;
  variables: MemoryVariable[];
  pointers: PointerVariable[];
  narration: string;
  activeIds: string[];
  undefinedBehavior?: UndefinedBehaviorState;
}

export interface PointerResult {
  scenarioId: PointerScenarioId;
}

export const POINTER_SCENARIO_OPTIONS: { id: PointerScenarioId; label: string }[] = [
  { id: "address-dereference", label: "Address and dereference" },
  { id: "swap-via-pointers", label: "Swap via pointers" },
  { id: "array-pointer-walk", label: "Array pointer walk" },
  { id: "null-dereference", label: "NULL pointer safety" },
];

function varCell(
  id: string,
  name: string,
  slot: number,
  value: number,
): MemoryVariable {
  return {
    id,
    name,
    type: "int",
    addressSlot: slot,
    value,
    valueState: "initialized",
  };
}

function ptrCell(
  id: string,
  name: string,
  slot: number,
  pointsTo: string | null,
  options: Partial<PointerVariable> = {},
): PointerVariable {
  return {
    id,
    name,
    type: "int *",
    addressSlot: slot,
    pointsTo,
    pointsToLabel: options.pointsToLabel,
    isNull: pointsTo === null,
    isDangling: options.isDangling,
  };
}

export function createAddressDereferenceTrace(): VisualizationTrace<
  PointerStep,
  PointerResult
> {
  const steps: PointerStep[] = [
    {
      kind: "declare-x",
      variables: [varCell("x", "x", 0, 5)],
      pointers: [],
      activeIds: ["x"],
      narration: "int x = 5; Variable x is created with value 5 at a simulated address.",
    },
    {
      kind: "address-of",
      variables: [varCell("x", "x", 0, 5)],
      pointers: [
        ptrCell("p", "p", 1, "x", { pointsToLabel: "x" }),
      ],
      activeIds: ["p"],
      narration:
        "int *p = &x; Pointer p is created. p now contains x's simulated address (pointer value), not x's value 5.",
    },
    {
      kind: "dereference-read",
      variables: [varCell("x", "x", 0, 5)],
      pointers: [
        ptrCell("p", "p", 1, "x", { pointsToLabel: "x" }),
      ],
      activeIds: ["p", "x"],
      narration:
        "Dereference *p reads the pointed-to value: x is 5. Pointer value (address) is distinct from pointed-to value (5).",
    },
    {
      kind: "dereference-write",
      variables: [varCell("x", "x", 0, 9)],
      pointers: [
        ptrCell("p", "p", 1, "x", { pointsToLabel: "x" }),
      ],
      activeIds: ["p", "x"],
      narration:
        "*p = 9; Assignment through the pointer changes x to 9. p still points to x.",
    },
  ];

  return { algorithmId: "address-dereference", steps, result: { scenarioId: "address-dereference" } };
}

export function createSwapViaPointersTrace(): VisualizationTrace<
  PointerStep,
  PointerResult
> {
  const steps: PointerStep[] = [
    {
      kind: "setup",
      variables: [varCell("left", "left", 0, 3), varCell("right", "right", 1, 9)],
      pointers: [],
      activeIds: ["left", "right"],
      narration: "Caller has left = 3 and right = 9.",
    },
    {
      kind: "call",
      variables: [varCell("left", "left", 0, 3), varCell("right", "right", 1, 9)],
      pointers: [
        ptrCell("a", "a (param)", 2, "left", { pointsToLabel: "left" }),
        ptrCell("b", "b (param)", 3, "right", { pointsToLabel: "right" }),
      ],
      activeIds: ["a", "b"],
      narration:
        "swap_ints(&left, &right): parameters a and b are passed by value — each holds a copy of an address identifying left and right.",
    },
    {
      kind: "tmp",
      variables: [
        varCell("left", "left", 0, 3),
        varCell("right", "right", 1, 9),
        varCell("tmp", "tmp (local)", 4, 3),
      ],
      pointers: [
        ptrCell("a", "a (param)", 2, "left", { pointsToLabel: "left" }),
        ptrCell("b", "b (param)", 3, "right", { pointsToLabel: "right" }),
      ],
      activeIds: ["tmp", "a"],
      narration: "tmp = *a; Read 3 from left through pointer a.",
    },
    {
      kind: "assign-b-to-a",
      variables: [
        varCell("left", "left", 0, 9),
        varCell("right", "right", 1, 9),
        varCell("tmp", "tmp (local)", 4, 3),
      ],
      pointers: [
        ptrCell("a", "a (param)", 2, "left", { pointsToLabel: "left" }),
        ptrCell("b", "b (param)", 3, "right", { pointsToLabel: "right" }),
      ],
      activeIds: ["a", "b"],
      narration: "*a = *b; Write right's value (9) to left through a.",
    },
    {
      kind: "assign-tmp-to-b",
      variables: [
        varCell("left", "left", 0, 9),
        varCell("right", "right", 1, 3),
        varCell("tmp", "tmp (local)", 4, 3),
      ],
      pointers: [
        ptrCell("a", "a (param)", 2, "left", { pointsToLabel: "left" }),
        ptrCell("b", "b (param)", 3, "right", { pointsToLabel: "right" }),
      ],
      activeIds: ["b"],
      narration: "*b = tmp; Write tmp (3) to right. Swap complete: left = 9, right = 3.",
    },
  ];

  return { algorithmId: "swap-via-pointers", steps, result: { scenarioId: "swap-via-pointers" } };
}

export function createArrayPointerWalkTrace(): VisualizationTrace<
  PointerStep,
  PointerResult
> {
  const values = [10, 20, 30];
  const makeArrayVars = (): MemoryVariable[] =>
    values.map((value, index) => ({
      id: `values-${index}`,
      name: index === 0 ? "values[0]" : `values[${index}]`,
      type: "int",
      addressSlot: 10 + index,
      value,
      valueState: "initialized" as const,
    }));

  const steps: PointerStep[] = [
    {
      kind: "array-init",
      variables: makeArrayVars(),
      pointers: [],
      activeIds: ["values-0", "values-1", "values-2"],
      narration: "int values[] = {10, 20, 30}; Array elements occupy consecutive simulated addresses.",
    },
    {
      kind: "p-init",
      variables: makeArrayVars(),
      pointers: [ptrCell("p", "p", 20, "values-0", { pointsToLabel: "values[0]" })],
      activeIds: ["p"],
      narration:
        "int *p = values; (equivalent to &values[0]). p points to the first element.",
    },
    {
      kind: "walk-0",
      variables: makeArrayVars(),
      pointers: [ptrCell("p", "p", 20, "values-0", { pointsToLabel: "values[0]" })],
      activeIds: ["p", "values-0"],
      narration: "Access values[0] or *p → 10.",
    },
    {
      kind: "walk-1",
      variables: makeArrayVars(),
      pointers: [ptrCell("p", "p", 20, "values-1", { pointsToLabel: "values[1]" })],
      activeIds: ["p", "values-1"],
      narration:
        "p advances to the next element. *(values + 1) is equivalent to values[1] → 20.",
    },
    {
      kind: "walk-2",
      variables: makeArrayVars(),
      pointers: [ptrCell("p", "p", 20, "values-2", { pointsToLabel: "values[2]" })],
      activeIds: ["p", "values-2"],
      narration: "Pointer at values[2]: *(values + 2) → 30.",
    },
    {
      kind: "one-past",
      variables: makeArrayVars(),
      pointers: [
        {
          id: "p",
          name: "p",
          type: "int *",
          addressSlot: 20,
          pointsTo: null,
          pointsToLabel: "one-past values[2]",
          isNull: false,
        },
      ],
      activeIds: ["p"],
      narration:
        "p may be formed one-past the last element for boundary arithmetic/comparison. It must not be dereferenced.",
    },
  ];

  return { algorithmId: "array-pointer-walk", steps, result: { scenarioId: "array-pointer-walk" } };
}

export function createNullDereferenceTrace(): VisualizationTrace<
  PointerStep,
  PointerResult
> {
  const steps: PointerStep[] = [
    {
      kind: "null-assign",
      variables: [],
      pointers: [ptrCell("p", "p", 0, null)],
      activeIds: ["p"],
      narration: "int *p = NULL; Pointer p has no target object.",
    },
    {
      kind: "null-deref",
      variables: [],
      pointers: [ptrCell("p", "p", 0, null)],
      activeIds: ["p"],
      narration: "Attempt *p — dereferencing NULL is undefined behavior.",
      undefinedBehavior: {
        kind: "null-dereference",
        message: "Invalid dereference: *p when p is NULL.",
      },
    },
  ];

  return { algorithmId: "null-dereference", steps, result: { scenarioId: "null-dereference" } };
}

export function createPointerTrace(
  scenarioId: PointerScenarioId,
): VisualizationTrace<PointerStep, PointerResult> {
  switch (scenarioId) {
    case "address-dereference":
      return createAddressDereferenceTrace();
    case "swap-via-pointers":
      return createSwapViaPointersTrace();
    case "array-pointer-walk":
      return createArrayPointerWalkTrace();
    case "null-dereference":
      return createNullDereferenceTrace();
  }
}

export function pointerStepMetrics(step: PointerStep): { label: string; value: string | number }[] {
  return [
    { label: "Variables", value: step.variables.length },
    { label: "Pointers", value: step.pointers.length },
    {
      label: "Active relations",
      value: step.pointers.filter((pointer) => pointer.pointsTo !== null).length,
    },
  ];
}
