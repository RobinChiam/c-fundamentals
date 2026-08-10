import { describe, expect, it, vi } from "vitest";
import * as curriculumApi from "../api/curriculum-api";
import {
  getEditableDescriptors,
  loadLessonWorkspace,
} from "./workspace-loader";
import {
  mockArraysLesson,
  mockLesson12,
  mockLesson14,
  mockPrimarySourceContent,
} from "../test-fixtures/curriculum";

vi.mock("../api/curriculum-api");

describe("workspace loader", () => {
  it("loads primary, support, and header files", async () => {
    vi.mocked(curriculumApi.getLessonFile).mockImplementation(
      async (_lessonId, fileId) => ({
        lessonId: "header-files-and-multiple-source-files",
        file:
          mockLesson12.files.find((file) => file.id === fileId) ??
          mockLesson12.files[1]!,
        content: `content:${fileId}`,
      }),
    );

    const descriptors = getEditableDescriptors(mockLesson12.files);
    expect(descriptors.map((file) => file.id)).toEqual([
      "primary",
      "geometry",
      "geometry-header",
    ]);

    const workspace = await loadLessonWorkspace(
      "header-files-and-multiple-source-files",
      mockLesson12.files,
    );

    expect(workspace.activeFileId).toBe("primary");
    expect(workspace.files.map((file) => file.id)).toEqual([
      "primary",
      "geometry",
      "geometry-header",
    ]);
  });

  it("excludes readme and solution descriptors", () => {
    const descriptors = getEditableDescriptors(mockArraysLesson.files);
    expect(descriptors.map((file) => file.role)).toEqual(["primary"]);
    expect(descriptors.some((file) => file.role === "readme")).toBe(false);
    expect(descriptors.some((file) => file.role === "solution")).toBe(false);
  });

  it("never requests solution content", async () => {
    vi.mocked(curriculumApi.getLessonFile).mockResolvedValue(
      mockPrimarySourceContent,
    );

    await loadLessonWorkspace("arrays", mockArraysLesson.files);

    expect(curriculumApi.getLessonFile).not.toHaveBeenCalledWith(
      "arrays",
      "solution",
    );
  });

  it("supports Lesson 12 multi-file shape", async () => {
    vi.mocked(curriculumApi.getLessonFile).mockImplementation(
      async (_lessonId, fileId) => ({
        lessonId: "header-files-and-multiple-source-files",
        file:
          mockLesson12.files.find((file) => file.id === fileId) ??
          mockLesson12.files[1]!,
        content: `content:${fileId}`,
      }),
    );

    const workspace = await loadLessonWorkspace(
      "header-files-and-multiple-source-files",
      mockLesson12.files,
    );

    expect(workspace.files.map((file) => file.name)).toEqual([
      "main.c",
      "geometry.c",
      "geometry.h",
    ]);
  });

  it("supports Lesson 14 multi-file shape", async () => {
    vi.mocked(curriculumApi.getLessonFile).mockImplementation(
      async (_lessonId, fileId) => ({
        lessonId: "intermediate-console-project",
        file:
          mockLesson14.files.find((file) => file.id === fileId) ??
          mockLesson14.files[1]!,
        content: `content:${fileId}`,
      }),
    );

    const workspace = await loadLessonWorkspace(
      "intermediate-console-project",
      mockLesson14.files,
    );

    expect(workspace.files).toHaveLength(7);
    expect(workspace.files.map((file) => file.name)).toEqual([
      "main.c",
      "task.c",
      "task.h",
      "store.c",
      "store.h",
      "util.c",
      "util.h",
    ]);
  });

  it("surfaces controlled failures when source loading fails", async () => {
    vi.mocked(curriculumApi.getLessonFile).mockRejectedValue(
      new curriculumApi.CurriculumApiError("boom"),
    );

    await expect(
      loadLessonWorkspace("arrays", mockArraysLesson.files),
    ).rejects.toThrow();
  });
});
