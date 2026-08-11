import type { VisualizationTrace } from "../core/visualization-types";
import type {
  HeapAllocation,
  MemoryVariable,
  PointerVariable,
  UndefinedBehaviorState,
} from "../memory/memory-types";

export type HeapScenarioId =
  | "malloc-init-free"
  | "calloc"
  | "realloc-move"
  | "realloc-failure"
  | "unsafe-realloc-leak"
  | "use-after-free";

export interface HeapStep {
  kind: string;
  pointers: PointerVariable[];
  allocations: HeapAllocation[];
  locals: MemoryVariable[];
  narration: string;
  activeIds: string[];
  leakWarning?: boolean;
  undefinedBehavior?: UndefinedBehaviorState;
}

export interface HeapResult {
  scenarioId: HeapScenarioId;
}

export const HEAP_SCENARIO_OPTIONS: { id: HeapScenarioId; label: string }[] = [
  { id: "malloc-init-free", label: "malloc / initialize / free" },
  { id: "calloc", label: "calloc (zero-initialized)" },
  { id: "realloc-move", label: "realloc succeeds and moves" },
  { id: "realloc-failure", label: "realloc fails safely" },
  { id: "unsafe-realloc-leak", label: "unsafe realloc overwrite (leak)" },
  { id: "use-after-free", label: "use-after-free / double-free" },
];

function uninitializedSlots(count: number): HeapAllocation["values"] {
  return Array.from({ length: count }, () => null);
}

function zeroSlots(count: number): HeapAllocation["values"] {
  return Array.from({ length: count }, () => 0);
}

function uninitializedStates(count: number): HeapAllocation["valueStates"] {
  return Array.from({ length: count }, () => "uninitialized" as const);
}

function zeroStates(count: number): HeapAllocation["valueStates"] {
  return Array.from({ length: count }, () => "zero" as const);
}

function initializedStates(count: number): HeapAllocation["valueStates"] {
  return Array.from({ length: count }, () => "initialized" as const);
}

function liveAlloc(
  id: string,
  label: string,
  slotCount: number,
  values: (number | null)[],
  valueStates: HeapAllocation["valueStates"],
  ownerPointerIds: string[],
): HeapAllocation {
  return {
    id,
    label,
    slotCount,
    values,
    valueStates,
    lifetime: "live",
    ownerPointerIds,
  };
}

function freedAlloc(
  id: string,
  label: string,
  slotCount: number,
): HeapAllocation {
  return {
    id,
    label,
    slotCount,
    values: uninitializedSlots(slotCount),
    valueStates: Array.from({ length: slotCount }, () => "invalid" as const),
    lifetime: "freed",
    ownerPointerIds: [],
  };
}

function leakedAlloc(
  id: string,
  label: string,
  slotCount: number,
): HeapAllocation {
  return {
    id,
    label,
    slotCount,
    values: uninitializedSlots(slotCount),
    valueStates: uninitializedStates(slotCount),
    lifetime: "leaked",
    ownerPointerIds: [],
  };
}

export function createMallocInitFreeTrace(): VisualizationTrace<HeapStep, HeapResult> {
  const steps: HeapStep[] = [
    {
      kind: "malloc",
      pointers: [
        {
          id: "p",
          name: "p",
          type: "int *",
          addressSlot: 0,
          pointsTo: "alloc-1",
          pointsToLabel: "allocation #1",
          isNull: false,
        },
      ],
      allocations: [
        liveAlloc("alloc-1", "allocation #1", 4, uninitializedSlots(4), uninitializedStates(4), [
          "p",
        ]),
      ],
      locals: [],
      activeIds: ["p", "alloc-1"],
      narration:
        "int *p = malloc(4 * sizeof *p); Live allocation #1 with 4 int slots. Contents are uninitialized / indeterminate (?), not zero.",
    },
    {
      kind: "init",
      pointers: [
        {
          id: "p",
          name: "p",
          type: "int *",
          addressSlot: 0,
          pointsTo: "alloc-1",
          pointsToLabel: "allocation #1",
          isNull: false,
        },
      ],
      allocations: [
        liveAlloc("alloc-1", "allocation #1", 4, [1, 2, 3, 4], initializedStates(4), ["p"]),
      ],
      locals: [],
      activeIds: ["alloc-1"],
      narration: "Initialize slots through p: values become 1, 2, 3, 4.",
    },
    {
      kind: "free",
      pointers: [
        {
          id: "p",
          name: "p",
          type: "int *",
          addressSlot: 0,
          pointsTo: "alloc-1",
          pointsToLabel: "allocation #1 (dangling)",
          isNull: false,
          isDangling: true,
        },
      ],
      allocations: [freedAlloc("alloc-1", "allocation #1", 4)],
      locals: [],
      activeIds: ["p", "alloc-1"],
      narration:
        "free(p); Allocation #1 lifetime ended. p still holds a stale/dangling conceptual address — it is NOT automatically set to NULL.",
    },
    {
      kind: "null-assign",
      pointers: [
        {
          id: "p",
          name: "p",
          type: "int *",
          addressSlot: 0,
          pointsTo: null,
          isNull: true,
        },
      ],
      allocations: [freedAlloc("alloc-1", "allocation #1", 4)],
      locals: [],
      activeIds: ["p"],
      narration: "p = NULL; Pointer no longer references any allocation.",
    },
  ];

  return { algorithmId: "malloc-init-free", steps, result: { scenarioId: "malloc-init-free" } };
}

export function createCallocTrace(): VisualizationTrace<HeapStep, HeapResult> {
  const steps: HeapStep[] = [
    {
      kind: "calloc",
      pointers: [
        {
          id: "p",
          name: "p",
          type: "int *",
          addressSlot: 0,
          pointsTo: "alloc-1",
          pointsToLabel: "allocation #1",
          isNull: false,
        },
      ],
      allocations: [
        liveAlloc("alloc-1", "allocation #1", 4, zeroSlots(4), zeroStates(4), ["p"]),
      ],
      locals: [],
      activeIds: ["p", "alloc-1"],
      narration:
        "calloc(4, sizeof *p) allocates and zero-initializes all slots. Unlike malloc, every element starts at 0.",
    },
  ];

  return { algorithmId: "calloc", steps, result: { scenarioId: "calloc" } };
}

export function createReallocMoveTrace(): VisualizationTrace<HeapStep, HeapResult> {
  const steps: HeapStep[] = [
    {
      kind: "initial",
      pointers: [
        {
          id: "p",
          name: "p",
          type: "int *",
          addressSlot: 0,
          pointsTo: "alloc-1",
          pointsToLabel: "allocation #1",
          isNull: false,
        },
      ],
      allocations: [
        liveAlloc("alloc-1", "allocation #1", 2, [10, 20], initializedStates(2), ["p"]),
      ],
      locals: [],
      activeIds: ["p", "alloc-1"],
      narration: "p owns allocation #1 with two initialized elements.",
    },
    {
      kind: "realloc-call",
      pointers: [
        {
          id: "p",
          name: "p",
          type: "int *",
          addressSlot: 0,
          pointsTo: "alloc-1",
          pointsToLabel: "allocation #1",
          isNull: false,
        },
        {
          id: "grown",
          name: "grown (temp)",
          type: "int *",
          addressSlot: 1,
          pointsTo: "alloc-2",
          pointsToLabel: "allocation #2",
          isNull: false,
        },
      ],
      allocations: [
        freedAlloc("alloc-1", "allocation #1 (old)", 2),
        liveAlloc("alloc-2", "allocation #2", 4, [10, 20, null, null], [
          ...initializedStates(2),
          ...uninitializedStates(2),
        ], ["grown"]),
      ],
      locals: [],
      activeIds: ["grown", "alloc-2"],
      narration:
        "grown = realloc(p, larger_size); Success — realloc may move an allocation; this scenario demonstrates the move case. grown points to new allocation #2; old #1 is no longer live.",
    },
    {
      kind: "reassign",
      pointers: [
        {
          id: "p",
          name: "p",
          type: "int *",
          addressSlot: 0,
          pointsTo: "alloc-2",
          pointsToLabel: "allocation #2",
          isNull: false,
        },
      ],
      allocations: [
        freedAlloc("alloc-1", "allocation #1 (old)", 2),
        liveAlloc("alloc-2", "allocation #2", 4, [10, 20, null, null], [
          ...initializedStates(2),
          ...uninitializedStates(2),
        ], ["p"]),
      ],
      locals: [],
      activeIds: ["p"],
      narration: "p = grown; Ownership transferred to p. Always check realloc's return value.",
    },
  ];

  return { algorithmId: "realloc-move", steps, result: { scenarioId: "realloc-move" } };
}

export function createReallocFailureTrace(): VisualizationTrace<HeapStep, HeapResult> {
  const steps: HeapStep[] = [
    {
      kind: "initial",
      pointers: [
        {
          id: "p",
          name: "p",
          type: "int *",
          addressSlot: 0,
          pointsTo: "alloc-1",
          pointsToLabel: "allocation #1",
          isNull: false,
        },
      ],
      allocations: [
        liveAlloc("alloc-1", "allocation #1", 2, [5, 6], initializedStates(2), ["p"]),
      ],
      locals: [],
      activeIds: ["p", "alloc-1"],
      narration: "p owns allocation #1.",
    },
    {
      kind: "realloc-fail",
      pointers: [
        {
          id: "p",
          name: "p",
          type: "int *",
          addressSlot: 0,
          pointsTo: "alloc-1",
          pointsToLabel: "allocation #1",
          isNull: false,
        },
        {
          id: "grown",
          name: "grown (temp)",
          type: "int *",
          addressSlot: 1,
          pointsTo: null,
          isNull: true,
        },
      ],
      allocations: [
        liveAlloc("alloc-1", "allocation #1", 2, [5, 6], initializedStates(2), ["p"]),
      ],
      locals: [],
      activeIds: ["grown", "p"],
      narration:
        "grown = realloc(p, larger_size); Simulated failure: grown is NULL. The original allocation #1 remains valid and p still owns it.",
    },
    {
      kind: "handle-failure",
      pointers: [
        {
          id: "p",
          name: "p",
          type: "int *",
          addressSlot: 0,
          pointsTo: "alloc-1",
          pointsToLabel: "allocation #1",
          isNull: false,
        },
      ],
      allocations: [
        liveAlloc("alloc-1", "allocation #1", 2, [5, 6], initializedStates(2), ["p"]),
      ],
      locals: [],
      activeIds: ["p"],
      narration: "Safe pattern: on failure, p still points to the original block. No leak, no double-free.",
    },
  ];

  return { algorithmId: "realloc-failure", steps, result: { scenarioId: "realloc-failure" } };
}

export function createUnsafeReallocLeakTrace(): VisualizationTrace<HeapStep, HeapResult> {
  const steps: HeapStep[] = [
    {
      kind: "initial",
      pointers: [
        {
          id: "p",
          name: "p",
          type: "int *",
          addressSlot: 0,
          pointsTo: "alloc-1",
          pointsToLabel: "allocation #1",
          isNull: false,
        },
      ],
      allocations: [
        liveAlloc("alloc-1", "allocation #1", 2, [1, 2], initializedStates(2), ["p"]),
      ],
      locals: [],
      activeIds: ["p", "alloc-1"],
      narration: "p owns allocation #1.",
    },
    {
      kind: "unsafe-overwrite",
      pointers: [
        {
          id: "p",
          name: "p",
          type: "int *",
          addressSlot: 0,
          pointsTo: null,
          isNull: true,
        },
      ],
      allocations: [leakedAlloc("alloc-1", "allocation #1 (leaked)", 2)],
      locals: [],
      activeIds: ["p", "alloc-1"],
      leakWarning: true,
      narration:
        "Unsafe: p = realloc(p, larger_size) with simulated failure. p becomes NULL but allocation #1 remains live with no pointer retaining its address — MEMORY LEAK.",
    },
  ];

  return {
    algorithmId: "unsafe-realloc-leak",
    steps,
    result: { scenarioId: "unsafe-realloc-leak" },
  };
}

export function createUseAfterFreeTrace(): VisualizationTrace<HeapStep, HeapResult> {
  const steps: HeapStep[] = [
    {
      kind: "malloc",
      pointers: [
        {
          id: "p",
          name: "p",
          type: "int *",
          addressSlot: 0,
          pointsTo: "alloc-1",
          pointsToLabel: "allocation #1",
          isNull: false,
        },
      ],
      allocations: [
        liveAlloc("alloc-1", "allocation #1", 1, [42], initializedStates(1), ["p"]),
      ],
      locals: [],
      activeIds: ["p", "alloc-1"],
      narration: "p points to a live allocation containing 42.",
    },
    {
      kind: "free",
      pointers: [
        {
          id: "p",
          name: "p",
          type: "int *",
          addressSlot: 0,
          pointsTo: "alloc-1",
          pointsToLabel: "allocation #1 (dangling)",
          isNull: false,
          isDangling: true,
        },
      ],
      allocations: [freedAlloc("alloc-1", "allocation #1", 1)],
      locals: [],
      activeIds: ["p"],
      narration: "free(p); Allocation ended. p is dangling.",
    },
    {
      kind: "use-after-free",
      pointers: [
        {
          id: "p",
          name: "p",
          type: "int *",
          addressSlot: 0,
          pointsTo: "alloc-1",
          pointsToLabel: "allocation #1 (dangling)",
          isNull: false,
          isDangling: true,
        },
      ],
      allocations: [freedAlloc("alloc-1", "allocation #1", 1)],
      locals: [],
      activeIds: ["p"],
      narration: "Attempt *p after free — undefined behavior.",
      undefinedBehavior: {
        kind: "use-after-free",
        message: "Use-after-free: reading through p after free(p).",
      },
    },
    {
      kind: "double-free",
      pointers: [
        {
          id: "p",
          name: "p",
          type: "int *",
          addressSlot: 0,
          pointsTo: "alloc-1",
          pointsToLabel: "allocation #1 (dangling)",
          isNull: false,
          isDangling: true,
        },
      ],
      allocations: [freedAlloc("alloc-1", "allocation #1", 1)],
      locals: [],
      activeIds: ["p"],
      narration: "Attempt free(p) again — undefined behavior (double-free).",
      undefinedBehavior: {
        kind: "double-free",
        message: "Double-free: calling free(p) on an already freed allocation.",
      },
    },
  ];

  return { algorithmId: "use-after-free", steps, result: { scenarioId: "use-after-free" } };
}

export function createHeapTrace(
  scenarioId: HeapScenarioId,
): VisualizationTrace<HeapStep, HeapResult> {
  switch (scenarioId) {
    case "malloc-init-free":
      return createMallocInitFreeTrace();
    case "calloc":
      return createCallocTrace();
    case "realloc-move":
      return createReallocMoveTrace();
    case "realloc-failure":
      return createReallocFailureTrace();
    case "unsafe-realloc-leak":
      return createUnsafeReallocLeakTrace();
    case "use-after-free":
      return createUseAfterFreeTrace();
  }
}

export function heapStepMetrics(step: HeapStep): { label: string; value: string | number }[] {
  const live = step.allocations.filter((allocation) => allocation.lifetime === "live").length;
  const freed = step.allocations.filter((allocation) => allocation.lifetime === "freed").length;
  const leaked = step.allocations.filter((allocation) => allocation.lifetime === "leaked").length;

  return [
    { label: "Live allocations", value: live },
    { label: "Freed allocations", value: freed },
    { label: "Leaked allocations", value: leaked },
    { label: "Owning pointers", value: step.pointers.filter((pointer) => !pointer.isNull).length },
  ];
}
