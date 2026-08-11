import { describe, expect, it } from "vitest";
import { SUPPORTED_ARCHITECTURE_LESSON_IDS } from "@learning-app/shared";
import { createCurriculumService } from "../curriculum/curriculum-service.js";
import { resolveDefaultRepositoryRoot } from "../curriculum/repository-root.js";
import { ARCHITECTURE_DEFINITIONS } from "./architecture-definitions.js";
import {
  ArchitectureIntegrityError,
  assertStaleAnnotationFails,
  validateArchitectureDefinitions,
} from "./architecture-integrity.js";

describe("architecture integrity", () => {
  const curriculumService = createCurriculumService({
    repositoryRoot: resolveDefaultRepositoryRoot(),
  });

  it("two supported architecture lessons exist", () => {
    expect(SUPPORTED_ARCHITECTURE_LESSON_IDS).toHaveLength(2);
    expect(ARCHITECTURE_DEFINITIONS).toHaveLength(2);
  });

  it("validates all referenced lesson IDs", async () => {
    await expect(
      validateArchitectureDefinitions(undefined, ARCHITECTURE_DEFINITIONS, curriculumService),
    ).resolves.toBeUndefined();
  });

  it("validates all referenced file IDs", async () => {
    await validateArchitectureDefinitions(undefined, ARCHITECTURE_DEFINITIONS, curriculumService);
    for (const definition of ARCHITECTURE_DEFINITIONS) {
      for (const module of definition.modules) {
        expect(module.fileIds.length).toBeGreaterThan(0);
      }
    }
  });

  it("rejects solution files from architecture definitions", async () => {
    const broken = structuredClone(ARCHITECTURE_DEFINITIONS[0]!);
    broken.modules[0]!.fileIds = ["solution"];
    await expect(
      validateArchitectureDefinitions(undefined, [broken], curriculumService),
    ).rejects.toThrow(ArchitectureIntegrityError);
  });

  it("requires unique module IDs", async () => {
    const broken = structuredClone(ARCHITECTURE_DEFINITIONS[1]!);
    broken.modules.push({ ...broken.modules[0]! });
    await expect(
      validateArchitectureDefinitions(undefined, [broken], curriculumService),
    ).rejects.toThrow(ArchitectureIntegrityError);
  });

  it("validates public-symbol annotations against source", async () => {
    await expect(
      validateArchitectureDefinitions(undefined, ARCHITECTURE_DEFINITIONS, curriculumService),
    ).resolves.toBeUndefined();
  });

  it("validates workflow symbol annotations where practical", async () => {
    const capstone = ARCHITECTURE_DEFINITIONS.find(
      (entry) => entry.lessonId === "intermediate-console-project",
    );
    expect(capstone?.workflows.length).toBeGreaterThanOrEqual(4);
    await validateArchitectureDefinitions(undefined, ARCHITECTURE_DEFINITIONS, curriculumService);
  });

  it("validates ownership references", async () => {
    const capstone = ARCHITECTURE_DEFINITIONS.find(
      (entry) => entry.lessonId === "intermediate-console-project",
    );
    expect(capstone?.ownership[0]?.ownerModuleId).toBe("store");
    await validateArchitectureDefinitions(undefined, ARCHITECTURE_DEFINITIONS, curriculumService);
  });

  it("build spec comes from existing trusted metadata", async () => {
    await validateArchitectureDefinitions(undefined, ARCHITECTURE_DEFINITIONS, curriculumService);
    const lesson12 = ARCHITECTURE_DEFINITIONS[0]!;
    expect(lesson12.lessonId).toBe("header-files-and-multiple-source-files");
  });

  it("stale/broken architecture annotation causes integrity failure", async () => {
    assertStaleAnnotationFails();
    const broken = structuredClone(ARCHITECTURE_DEFINITIONS[0]!);
    broken.publicApis = [
      {
        fileId: "geometry-header",
        symbols: ["THIS_SYMBOL_DOES_NOT_EXIST_IN_GEOMETRY_H"],
      },
    ];
    const brokenDefinitions = ARCHITECTURE_DEFINITIONS.map((definition) =>
      definition.lessonId === broken.lessonId ? broken : definition,
    );
    await expect(
      validateArchitectureDefinitions(undefined, brokenDefinitions, curriculumService),
    ).rejects.toThrow(/Stale public symbol/);
  });
});
