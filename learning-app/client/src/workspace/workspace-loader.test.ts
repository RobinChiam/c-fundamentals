import { beforeEach, describe, expect, it, vi } from "vitest";
import * as curriculumApi from "../api/curriculum-api";
import * as persistenceApi from "../api/persistence-api";
import { getEditableDescriptors, loadLessonWorkspace } from "./workspace-loader";
import {
  mockArraysLesson,
  mockLesson12,
  mockLesson14,
  mockPrimarySourceContent,
} from "../test-fixtures/curriculum";

vi.mock("../api/curriculum-api");
vi.mock("../api/persistence-api");

describe("workspace loader", () => {
  beforeEach(() => {
    vi.mocked(persistenceApi.getLessonDrafts).mockImplementation(
      async (lessonId: string) => ({
        lessonId,
        drafts: [],
      }),
    );
  });

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

    const loaded = await loadLessonWorkspace(
      "header-files-and-multiple-source-files",
      mockLesson12.files,
    );

    expect(loaded.workspace.activeFileId).toBe("primary");
    expect(loaded.workspace.files.map((file) => file.id)).toEqual([
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

    const loaded = await loadLessonWorkspace(
      "header-files-and-multiple-source-files",
      mockLesson12.files,
    );

    expect(loaded.workspace.files.map((file) => file.name)).toEqual([
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

    const loaded = await loadLessonWorkspace(
      "intermediate-console-project",
      mockLesson14.files,
    );

    expect(loaded.workspace.files).toHaveLength(7);
    expect(loaded.workspace.files.map((file) => file.name)).toEqual([
      "main.c",
      "task.c",
      "task.h",
      "store.c",
      "store.h",
      "util.c",
      "util.h",
    ]);
  });

  it("hydrates non-stale saved drafts", async () => {
    vi.mocked(curriculumApi.getLessonFile).mockResolvedValue(
      mockPrimarySourceContent,
    );
    vi.mocked(persistenceApi.getLessonDrafts).mockResolvedValue({
      lessonId: "arrays",
      drafts: [
        {
          lessonId: "arrays",
          fileId: "primary",
          content: "saved draft",
          updatedAt: "2026-01-01T00:00:00.000Z",
          stale: false,
        },
      ],
    });

    const loaded = await loadLessonWorkspace("arrays", mockArraysLesson.files);
    expect(loaded.workspace.files[0]?.draftContent).toBe("saved draft");
    expect(loaded.staleDrafts).toHaveLength(0);
  });

  it("returns stale drafts without auto applying them", async () => {
    vi.mocked(curriculumApi.getLessonFile).mockResolvedValue(
      mockPrimarySourceContent,
    );
    vi.mocked(persistenceApi.getLessonDrafts).mockResolvedValue({
      lessonId: "arrays",
      drafts: [
        {
          lessonId: "arrays",
          fileId: "primary",
          content: "old draft",
          updatedAt: "2026-01-01T00:00:00.000Z",
          stale: true,
        },
      ],
    });

    const loaded = await loadLessonWorkspace("arrays", mockArraysLesson.files);
    expect(loaded.workspace.files[0]?.draftContent).toBe(
      mockPrimarySourceContent.content,
    );
    expect(loaded.staleDrafts).toHaveLength(1);
  });
});
