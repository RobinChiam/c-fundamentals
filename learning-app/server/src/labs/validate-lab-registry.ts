import path from "node:path";
import type { ManifestLessonEntry } from "../curriculum/manifest.js";
import { CURRICULUM_MANIFEST } from "../curriculum/manifest.js";
import { LabRegistryIntegrityError } from "./lab-errors.js";
import { LAB_REGISTRY } from "./lab-registry.js";
import type { LabDefinition } from "./lab-types.js";

const SAFE_FILENAME_PATTERN = /^[A-Za-z0-9._-]+$/;

function assertSafeFilename(filename: string, context: string): void {
  if (!SAFE_FILENAME_PATTERN.test(filename)) {
    throw new LabRegistryIntegrityError(`${context} has unsafe filename: ${filename}`);
  }
  if (filename.includes("/") || filename.includes("\\")) {
    throw new LabRegistryIntegrityError(`${context} has path separator in filename`);
  }
}

export function validateLabRegistry(
  manifest: ManifestLessonEntry[] = CURRICULUM_MANIFEST,
  labs: LabDefinition[] = LAB_REGISTRY,
): void {
  const lessonIds = new Set(manifest.map((lesson) => lesson.id));
  const labIds = new Set<string>();
  const starterFileIds = new Set<string>();

  for (const lab of labs) {
    if (labIds.has(lab.id)) {
      throw new LabRegistryIntegrityError(`Duplicate lab id: ${lab.id}`);
    }
    labIds.add(lab.id);

    if (!lessonIds.has(lab.lessonId)) {
      throw new LabRegistryIntegrityError(
        `Lab ${lab.id} references unknown lesson: ${lab.lessonId}`,
      );
    }

    if (lab.exerciseNumber <= 0) {
      throw new LabRegistryIntegrityError(
        `Lab ${lab.id} exercise number must be positive`,
      );
    }

    if (lab.revision <= 0) {
      throw new LabRegistryIntegrityError(
        `Lab ${lab.id} revision must be positive`,
      );
    }

    const lesson = manifest.find((entry) => entry.id === lab.lessonId);
    if (!lesson) {
      throw new LabRegistryIntegrityError(`Missing lesson for lab ${lab.id}`);
    }

    const solutionFile = lesson.files.find((file) => file.id === lab.solutionFileId);
    if (!solutionFile) {
      throw new LabRegistryIntegrityError(
        `Lab ${lab.id} solution reference missing: ${lab.solutionFileId}`,
      );
    }
    if (solutionFile.role !== "solution") {
      throw new LabRegistryIntegrityError(
        `Lab ${lab.id} solution reference must have role solution`,
      );
    }

    const starterIds = new Set<string>();
    for (const starter of lab.starterFiles) {
      if (starterIds.has(starter.id)) {
        throw new LabRegistryIntegrityError(
          `Duplicate starter file id in lab ${lab.id}: ${starter.id}`,
        );
      }
      starterIds.add(starter.id);

      const globalStarterKey = `${lab.id}:${starter.id}`;
      if (starterFileIds.has(globalStarterKey)) {
        throw new LabRegistryIntegrityError(
          `Duplicate starter file id across labs: ${starter.id}`,
        );
      }
      starterFileIds.add(globalStarterKey);

      assertSafeFilename(starter.name, `Lab ${lab.id} starter ${starter.id}`);
      const resolved = path.basename(starter.name);
      if (resolved !== starter.name) {
        throw new LabRegistryIntegrityError(
          `Lab ${lab.id} starter filename must be local: ${starter.name}`,
        );
      }
    }

    if (!starterIds.has(lab.evaluation.submissionFileId)) {
      throw new LabRegistryIntegrityError(
        `Lab ${lab.id} evaluation references missing starter file`,
      );
    }

    assertSafeFilename(
      lab.evaluation.harnessFileName,
      `Lab ${lab.id} harness`,
    );

    const allTests = [...lab.publicTests, ...lab.hiddenTests];
    if (allTests.length === 0) {
      throw new LabRegistryIntegrityError(`Lab ${lab.id} must have at least one test`);
    }

    const testIds = new Set<string>();
    for (const test of allTests) {
      if (testIds.has(test.id)) {
        throw new LabRegistryIntegrityError(
          `Duplicate test id in lab ${lab.id}: ${test.id}`,
        );
      }
      testIds.add(test.id);
    }

    for (let index = 0; index < lab.hints.length; index += 1) {
      if (lab.hints[index]?.index !== index) {
        throw new LabRegistryIntegrityError(
          `Lab ${lab.id} hint ordering must be deterministic starting at 0`,
        );
      }
    }
  }
}
