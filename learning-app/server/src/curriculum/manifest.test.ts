import { describe, expect, it } from "vitest";
import { CURRICULUM_MANIFEST } from "./manifest.js";
import { validateManifestIntegrity, CurriculumIntegrityError } from "./curriculum-service.js";
import { resolveDefaultRepositoryRoot } from "./repository-root.js";

describe("curriculum manifest integrity", () => {
  const repositoryRoot = resolveDefaultRepositoryRoot();

  it("contains 16 curriculum entries", () => {
    expect(CURRICULUM_MANIFEST).toHaveLength(16);
  });

  it("uses unique lesson ids", () => {
    const ids = CURRICULUM_MANIFEST.map((lesson) => lesson.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses unique sequence values in deterministic order", () => {
    const sequences = CURRICULUM_MANIFEST.map((lesson) => lesson.sequence);
    expect(new Set(sequences).size).toBe(sequences.length);
    expect([...sequences].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 16 }, (_, index) => index),
    );
  });

  it("includes two Lesson 0 starter entries", () => {
    const lessonZeroEntries = CURRICULUM_MANIFEST.filter(
      (lesson) => lesson.lessonNumber === 0,
    );
    expect(lessonZeroEntries.map((lesson) => lesson.id)).toEqual([
      "basic-io",
      "drawing-shapes",
    ]);
  });

  it("validates every declared file against the repository", async () => {
    await expect(
      validateManifestIntegrity(repositoryRoot, CURRICULUM_MANIFEST),
    ).resolves.toBeUndefined();
  });

  it("marks solution files with the solution role", () => {
    for (const lesson of CURRICULUM_MANIFEST) {
      const solutionFiles = lesson.files.filter(
        (file) => file.name === "solution.c",
      );
      expect(solutionFiles).toHaveLength(1);
      expect(solutionFiles[0]?.role).toBe("solution");
    }
  });

  it("represents Lesson 12 as a multi-file lesson", () => {
    const lesson = CURRICULUM_MANIFEST.find(
      (entry) => entry.id === "header-files-and-multiple-source-files",
    );
    expect(lesson?.files.map((file) => file.role)).toEqual([
      "readme",
      "primary",
      "support",
      "header",
      "solution",
    ]);
  });

  it("represents Lesson 14 as a multi-file capstone", () => {
    const lesson = CURRICULUM_MANIFEST.find(
      (entry) => entry.id === "intermediate-console-project",
    );
    expect(lesson?.files).toHaveLength(9);
    expect(lesson?.files.map((file) => file.role)).toEqual([
      "readme",
      "primary",
      "support",
      "header",
      "support",
      "header",
      "support",
      "header",
      "solution",
    ]);
  });

  it("fails when a declared repository file is missing", async () => {
    const driftedManifest = structuredClone(CURRICULUM_MANIFEST);
    const arraysLesson = driftedManifest.find((lesson) => lesson.id === "arrays");
    const primaryFile = arraysLesson?.files.find((file) => file.id === "primary");
    if (!primaryFile) {
      throw new Error("Expected arrays primary file in manifest");
    }
    primaryFile.relativePath = "Arrays/missing.c";

    await expect(
      validateManifestIntegrity(repositoryRoot, driftedManifest),
    ).rejects.toThrow(CurriculumIntegrityError);
  });
});
