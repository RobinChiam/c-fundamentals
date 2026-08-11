import { describe, expect, it } from "vitest";
import { LAB_REGISTRY } from "./lab-registry.js";
import { validateLabRegistry } from "./validate-lab-registry.js";

describe("lab registry integrity", () => {
  it("four required labs exist", () => {
    expect(LAB_REGISTRY).toHaveLength(4);
    expect(LAB_REGISTRY.map((lab) => lab.id)).toEqual([
      "conditional-leap-year",
      "functions-is-prime",
      "arrays-count-above",
      "pointers-absolute",
    ]);
  });

  it("passes registry validation", () => {
    expect(() => validateLabRegistry()).not.toThrow();
  });

  it("rejects duplicate lab ids", () => {
    const broken = [
      ...LAB_REGISTRY,
      { ...LAB_REGISTRY[0], id: LAB_REGISTRY[0].id },
    ];
    expect(() => validateLabRegistry(undefined, broken)).toThrow(/Duplicate lab id/);
  });

  it("rejects unknown lesson references", () => {
    const broken = [{ ...LAB_REGISTRY[0], lessonId: "unknown-lesson" }];
    expect(() => validateLabRegistry(undefined, broken)).toThrow(/unknown lesson/);
  });

  it("rejects invalid exercise numbers", () => {
    const broken = [{ ...LAB_REGISTRY[0], exerciseNumber: 0 }];
    expect(() => validateLabRegistry(undefined, broken)).toThrow(/exercise number/);
  });

  it("rejects invalid revisions", () => {
    const broken = [{ ...LAB_REGISTRY[0], revision: 0 }];
    expect(() => validateLabRegistry(undefined, broken)).toThrow(/revision/);
  });

  it("rejects broken solution references", () => {
    const broken = [{ ...LAB_REGISTRY[0], solutionFileId: "missing" }];
    expect(() => validateLabRegistry(undefined, broken)).toThrow(/solution reference/);
  });

  it("rejects duplicate test ids", () => {
    const broken = [
      {
        ...LAB_REGISTRY[0],
        hiddenTests: [
          ...LAB_REGISTRY[0].hiddenTests,
          { ...LAB_REGISTRY[0].hiddenTests[0] },
        ],
      },
    ];
    expect(() => validateLabRegistry(undefined, broken)).toThrow(/Duplicate test id/);
  });

  it("rejects invalid hint ordering", () => {
    const broken = [
      {
        ...LAB_REGISTRY[0],
        hints: LAB_REGISTRY[0].hints.map((hint, index) => ({
          ...hint,
          index: index + 1,
        })),
      },
    ];
    expect(() => validateLabRegistry(undefined, broken)).toThrow(/hint ordering/);
  });
});
