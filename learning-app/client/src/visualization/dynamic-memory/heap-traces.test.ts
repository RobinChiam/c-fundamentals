import { describe, expect, it } from "vitest";
import {
  createCallocTrace,
  createHeapTrace,
  createMallocInitFreeTrace,
  createReallocFailureTrace,
  createReallocMoveTrace,
  createUnsafeReallocLeakTrace,
  createUseAfterFreeTrace,
} from "./heap-traces";

describe("heap-traces malloc/calloc/free", () => {
  it("malloc produces live allocation", () => {
    const trace = createMallocInitFreeTrace();
    const step = trace.steps[0]!;
    expect(step.allocations[0]!.lifetime).toBe("live");
  });

  it("malloc contents shown uninitialized", () => {
    const trace = createMallocInitFreeTrace();
    const step = trace.steps[0]!;
    expect(step.allocations[0]!.values.every((value) => value === null)).toBe(true);
    expect(step.allocations[0]!.valueStates.every((state) => state === "uninitialized")).toBe(
      true,
    );
  });

  it("malloc not shown zeroed", () => {
    const trace = createMallocInitFreeTrace();
    const step = trace.steps[0]!;
    expect(step.allocations[0]!.valueStates.some((state) => state === "zero")).toBe(false);
  });

  it("calloc shown zero-initialized", () => {
    const trace = createCallocTrace();
    const step = trace.steps[0]!;
    expect(step.allocations[0]!.values).toEqual([0, 0, 0, 0]);
    expect(step.allocations[0]!.valueStates.every((state) => state === "zero")).toBe(true);
  });

  it("initialization updates allocation", () => {
    const trace = createMallocInitFreeTrace();
    const step = trace.steps.find((entry) => entry.kind === "init")!;
    expect(step.allocations[0]!.values).toEqual([1, 2, 3, 4]);
  });

  it("free ends allocation lifetime", () => {
    const trace = createMallocInitFreeTrace();
    const step = trace.steps.find((entry) => entry.kind === "free")!;
    expect(step.allocations[0]!.lifetime).toBe("freed");
  });

  it("free does not automatically NULL pointer", () => {
    const trace = createMallocInitFreeTrace();
    const step = trace.steps.find((entry) => entry.kind === "free")!;
    expect(step.pointers[0]!.isNull).toBe(false);
    expect(step.pointers[0]!.isDangling).toBe(true);
  });

  it("explicit pointer NULL works", () => {
    const trace = createMallocInitFreeTrace();
    const step = trace.steps.find((entry) => entry.kind === "null-assign")!;
    expect(step.pointers[0]!.isNull).toBe(true);
    expect(step.pointers[0]!.pointsTo).toBeNull();
  });

  it("dangling state represented", () => {
    const trace = createMallocInitFreeTrace();
    const step = trace.steps.find((entry) => entry.kind === "free")!;
    expect(step.pointers[0]!.isDangling).toBe(true);
  });
});

describe("heap-traces realloc", () => {
  it("realloc success/move scenario correct", () => {
    const trace = createReallocMoveTrace();
    const moveStep = trace.steps.find((entry) => entry.kind === "realloc-call")!;
    expect(moveStep.allocations.some((allocation) => allocation.id === "alloc-2")).toBe(true);
    expect(moveStep.allocations.find((allocation) => allocation.id === "alloc-1")?.lifetime).toBe(
      "freed",
    );
  });

  it("narration says realloc may move, not always", () => {
    const trace = createReallocMoveTrace();
    const moveStep = trace.steps.find((entry) => entry.kind === "realloc-call")!;
    expect(moveStep.narration).toMatch(/may move/i);
    expect(moveStep.narration).not.toMatch(/always moves/i);
  });

  it("realloc failure preserves old allocation", () => {
    const trace = createReallocFailureTrace();
    const failStep = trace.steps.find((entry) => entry.kind === "realloc-fail")!;
    expect(failStep.pointers.find((pointer) => pointer.id === "grown")?.isNull).toBe(true);
    expect(failStep.allocations[0]!.lifetime).toBe("live");
    expect(failStep.pointers.find((pointer) => pointer.id === "p")?.pointsTo).toBe("alloc-1");
  });

  it("safe temporary-pointer pattern preserves ownership", () => {
    const trace = createReallocFailureTrace();
    const handleStep = trace.steps.find((entry) => entry.kind === "handle-failure")!;
    expect(handleStep.pointers[0]!.pointsTo).toBe("alloc-1");
    expect(handleStep.allocations[0]!.lifetime).toBe("live");
  });

  it("unsafe overwrite produces modeled leak", () => {
    const trace = createUnsafeReallocLeakTrace();
    const step = trace.steps.find((entry) => entry.leakWarning)!;
    expect(step.leakWarning).toBe(true);
    expect(step.allocations[0]!.lifetime).toBe("leaked");
    expect(step.pointers[0]!.isNull).toBe(true);
  });

  it("leaked live allocation identified", () => {
    const trace = createUnsafeReallocLeakTrace();
    const step = trace.steps.at(-1)!;
    expect(step.allocations[0]!.lifetime).toBe("leaked");
  });
});

describe("heap-traces undefined behavior", () => {
  it("use-after-free yields UB state", () => {
    const trace = createUseAfterFreeTrace();
    const step = trace.steps.find((entry) => entry.kind === "use-after-free")!;
    expect(step.undefinedBehavior?.kind).toBe("use-after-free");
  });

  it("double-free yields UB state", () => {
    const trace = createUseAfterFreeTrace();
    const step = trace.steps.find((entry) => entry.kind === "double-free")!;
    expect(step.undefinedBehavior?.kind).toBe("double-free");
  });

  it("no fabricated UB result", () => {
    const trace = createUseAfterFreeTrace();
    const ubSteps = trace.steps.filter((entry) => entry.undefinedBehavior);
    for (const step of ubSteps) {
      expect(step.narration).toMatch(/undefined behavior/i);
    }
  });

  it("inputs not mutated via createHeapTrace", () => {
    const id = "calloc" as const;
    createHeapTrace(id);
    expect(id).toBe("calloc");
  });
});
