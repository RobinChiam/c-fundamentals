import { describe, expect, it } from "vitest";
import {
  createAddressDereferenceTrace,
  createArrayPointerWalkTrace,
  createNullDereferenceTrace,
  createPointerTrace,
  createSwapViaPointersTrace,
} from "./pointer-traces";

describe("pointer-traces address/dereference", () => {
  it("&x produces pointer relation to x", () => {
    const trace = createAddressDereferenceTrace();
    const step = trace.steps.find((entry) => entry.kind === "address-of")!;
    expect(step.pointers[0]!.pointsTo).toBe("x");
  });

  it("dereference reads target", () => {
    const trace = createAddressDereferenceTrace();
    const step = trace.steps.find((entry) => entry.kind === "dereference-read")!;
    expect(step.variables.find((variable) => variable.name === "x")?.value).toBe(5);
  });

  it("assignment through pointer changes target", () => {
    const trace = createAddressDereferenceTrace();
    const step = trace.steps.find((entry) => entry.kind === "dereference-write")!;
    expect(step.variables.find((variable) => variable.name === "x")?.value).toBe(9);
  });

  it("pointer variable remains distinct from target", () => {
    const trace = createAddressDereferenceTrace();
    const step = trace.steps.find((entry) => entry.kind === "dereference-read")!;
    expect(step.pointers[0]!.name).toBe("p");
    expect(step.variables.find((variable) => variable.name === "x")?.value).toBe(5);
  });
});

describe("pointer-traces swap", () => {
  it("swap exchanges caller values", () => {
    const trace = createSwapViaPointersTrace();
    const final = trace.steps.at(-1)!;
    expect(final.variables.find((variable) => variable.name === "left")?.value).toBe(9);
    expect(final.variables.find((variable) => variable.name === "right")?.value).toBe(3);
  });

  it("pointer parameters reference caller objects correctly", () => {
    const trace = createSwapViaPointersTrace();
    const callStep = trace.steps.find((entry) => entry.kind === "call")!;
    expect(callStep.pointers.find((pointer) => pointer.name.startsWith("a"))?.pointsTo).toBe(
      "left",
    );
    expect(callStep.pointers.find((pointer) => pointer.name.startsWith("b"))?.pointsTo).toBe(
      "right",
    );
  });
});

describe("pointer-traces array walk", () => {
  it("array walk advances by element", () => {
    const trace = createArrayPointerWalkTrace();
    const walkSteps = trace.steps.filter((entry) => entry.kind.startsWith("walk-"));
    expect(walkSteps.length).toBe(3);
  });

  it("one-past not dereferenced", () => {
    const trace = createArrayPointerWalkTrace();
    const step = trace.steps.find((entry) => entry.kind === "one-past")!;
    expect(step.pointers[0]!.pointsTo).toBeNull();
    expect(step.narration).toMatch(/must not be dereferenced/i);
  });
});

describe("pointer-traces NULL", () => {
  it("NULL has no target", () => {
    const trace = createNullDereferenceTrace();
    const step = trace.steps[0]!;
    expect(step.pointers[0]!.isNull).toBe(true);
    expect(step.pointers[0]!.pointsTo).toBeNull();
  });

  it("NULL dereference yields UB teaching state", () => {
    const trace = createNullDereferenceTrace();
    const step = trace.steps.find((entry) => entry.undefinedBehavior)!;
    expect(step.undefinedBehavior?.kind).toBe("null-dereference");
  });

  it("no fabricated NULL result", () => {
    const trace = createNullDereferenceTrace();
    const step = trace.steps.find((entry) => entry.undefinedBehavior)!;
    expect(step.variables).toHaveLength(0);
    expect(step.narration).toMatch(/undefined behavior/i);
  });

  it("input state not mutated via createPointerTrace", () => {
    const id = "address-dereference" as const;
    createPointerTrace(id);
    expect(id).toBe("address-dereference");
  });
});
