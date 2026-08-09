import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { ManifestLessonEntry } from "./manifest.js";
import {
  createCurriculumService,
  CurriculumIntegrityError,
  LessonFileNotFoundError,
  LessonNotFoundError,
} from "./curriculum-service.js";
import { resolveDefaultRepositoryRoot } from "./repository-root.js";

describe("curriculum service", () => {
  const repositoryRoot = resolveDefaultRepositoryRoot();
  const service = createCurriculumService({ repositoryRoot });
  const tempDirectories: string[] = [];

  afterEach(async () => {
    // Temp directories are left for the OS to clean up; tracked only for clarity.
    tempDirectories.length = 0;
  });

  it("lists lessons ordered by sequence", () => {
    const lessons = service.listLessons();
    expect(lessons).toHaveLength(16);
    expect(lessons.map((lesson) => lesson.sequence)).toEqual(
      Array.from({ length: 16 }, (_, index) => index),
    );
    expect(lessons[0]?.id).toBe("basic-io");
    expect(lessons[1]?.id).toBe("drawing-shapes");
    expect(lessons.filter((lesson) => lesson.lessonNumber === 0)).toHaveLength(
      2,
    );
  });

  it("returns lesson detail for arrays", () => {
    const lesson = service.getLessonDetail("arrays");
    expect(lesson).toMatchObject({
      id: "arrays",
      lessonNumber: 6,
      title: "Arrays",
      difficulty: "Intermediate",
    });
    expect(lesson.files.map((file) => file.id)).toEqual([
      "readme",
      "primary",
      "solution",
    ]);
  });

  it("returns multi-file detail for Lesson 12", () => {
    const lesson = service.getLessonDetail(
      "header-files-and-multiple-source-files",
    );
    expect(lesson.files.map((file) => ({ id: file.id, role: file.role }))).toEqual([
      { id: "readme", role: "readme" },
      { id: "primary", role: "primary" },
      { id: "geometry", role: "support" },
      { id: "geometry-header", role: "header" },
      { id: "solution", role: "solution" },
    ]);
  });

  it("returns multi-file detail for Lesson 14", () => {
    const lesson = service.getLessonDetail("intermediate-console-project");
    expect(lesson.files.map((file) => file.id)).toEqual([
      "readme",
      "primary",
      "task",
      "task-header",
      "store",
      "store-header",
      "util",
      "util-header",
      "solution",
    ]);
  });

  it("reads repository content for an approved lesson file", async () => {
    const fileContent = await service.getLessonFileContent("arrays", "primary");
    expect(fileContent.file.name).toBe("arrays.c");
    expect(fileContent.content).toContain("Lesson 6 — Arrays");
  });

  it("throws for unknown lessons", () => {
    expect(() => service.getLessonDetail("missing-lesson")).toThrow(
      LessonNotFoundError,
    );
  });

  it("throws for unknown files", async () => {
    await expect(
      service.getLessonFileContent("arrays", "missing-file"),
    ).rejects.toThrow(LessonFileNotFoundError);
  });

  it("rejects manifest paths that escape the lesson directory", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "curriculum-root-"));
    tempDirectories.push(tempRoot);

    const lessonDirectory = path.join(tempRoot, "Arrays");
    await mkdir(lessonDirectory, { recursive: true });
    await writeFile(
      path.join(tempRoot, "outside.c"),
      "int main(){return 0;}\n",
    );

    const escapingService = createCurriculumService({
      repositoryRoot: tempRoot,
      manifest: [
        {
          id: "arrays",
          lessonNumber: 6,
          sequence: 0,
          title: "Arrays",
          difficulty: "Intermediate",
          directory: "Arrays",
          files: [
            {
              id: "primary",
              name: "outside.c",
              role: "primary",
              language: "c",
              relativePath: "Arrays/../outside.c",
            },
          ],
        },
      ],
    });

    await expect(
      escapingService.getLessonFileContent("arrays", "primary"),
    ).rejects.toThrow(CurriculumIntegrityError);
  });

  it("treats missing declared files as integrity failures", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "curriculum-root-"));
    tempDirectories.push(tempRoot);

    const lessonDirectory = path.join(tempRoot, "Arrays");
    await mkdir(lessonDirectory, { recursive: true });

    const brokenManifest: ManifestLessonEntry[] = [
      {
        id: "arrays",
        lessonNumber: 6,
        sequence: 0,
        title: "Arrays",
        difficulty: "Intermediate",
        directory: "Arrays",
        files: [
          {
            id: "primary",
            name: "arrays.c",
            role: "primary",
            language: "c",
            relativePath: "Arrays/arrays.c",
          },
        ],
      },
    ];

    const brokenService = createCurriculumService({
      repositoryRoot: tempRoot,
      manifest: brokenManifest,
    });

    await expect(
      brokenService.getLessonFileContent("arrays", "primary"),
    ).rejects.toThrow(CurriculumIntegrityError);
  });
});
