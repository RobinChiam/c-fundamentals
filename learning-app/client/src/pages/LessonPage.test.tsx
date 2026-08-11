import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as curriculumApi from "../api/curriculum-api";
import * as persistenceApi from "../api/persistence-api";
import * as labsApi from "../api/labs-api";
import { LessonPage } from "./LessonPage";
import {
  mockArraysLesson,
  mockCurriculumResponse,
  mockLesson12,
  mockLesson14,
  mockPrimarySourceContent,
  mockReadmeContent,
} from "../test-fixtures/curriculum";
import { renderWithRouter } from "../test-utils";

vi.mock("../api/curriculum-api");
vi.mock("../api/persistence-api");
vi.mock("../api/labs-api");

function mockPersistenceDefaults() {
  vi.mocked(persistenceApi.visitLesson).mockImplementation(
    async (lessonId: string) => ({
      lessonId,
      status: "in_progress",
      lastVisitedAt: "2026-01-01T00:00:00.000Z",
      completedAt: null,
      updatedAt: "2026-01-01T00:00:00.000Z",
    }),
  );
  vi.mocked(persistenceApi.getLessonDrafts).mockImplementation(
    async (lessonId: string) => ({
      lessonId,
      drafts: [],
    }),
  );
}

function mockArraysFiles() {
  vi.mocked(curriculumApi.getLessonFile).mockImplementation(
    async (_lessonId, fileId) => {
      if (fileId === "readme") {
        return mockReadmeContent;
      }
      if (fileId === "primary") {
        return mockPrimarySourceContent;
      }

      throw new curriculumApi.CurriculumApiError(`Unexpected file ${fileId}`);
    },
  );
}

function mockMultiFileResponses(
  lessonId: string,
  lesson: typeof mockLesson12 | typeof mockLesson14,
) {
  vi.mocked(curriculumApi.getLessonFile).mockImplementation(
    async (_lessonId, fileId) => {
      if (fileId === "readme") {
        return {
          lessonId,
          file: lesson.files.find((file) => file.id === "readme")!,
          content: "# Lesson",
        };
      }

      const file = lesson.files.find((entry) => entry.id === fileId);
      if (!file) {
        throw new curriculumApi.CurriculumApiError(`Unexpected file ${fileId}`);
      }

      return {
        lessonId,
        file,
        content: `content:${fileId}`,
      };
    },
  );
}

describe("LessonPage", () => {
  beforeEach(() => {
    mockPersistenceDefaults();
    vi.mocked(labsApi.listLessonLabs).mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("loads a valid lesson and renders repository README markdown", async () => {
    vi.mocked(curriculumApi.listCurriculum).mockResolvedValue(mockCurriculumResponse);
    vi.mocked(curriculumApi.getLesson).mockResolvedValue(mockArraysLesson);
    mockArraysFiles();

    renderWithRouter(<LessonPage />, {
      route: "/lessons/arrays",
      path: "/lessons/:lessonId",
    });

    expect(screen.getByText("Loading lesson…")).toBeInTheDocument();

    expect(
      await screen.findByRole("heading", { level: 1, name: "Arrays" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Review indexing")).toBeInTheDocument();
  });

  it("does not automatically request solution file contents", async () => {
    vi.mocked(curriculumApi.listCurriculum).mockResolvedValue(mockCurriculumResponse);
    vi.mocked(curriculumApi.getLesson).mockResolvedValue(mockArraysLesson);
    mockArraysFiles();

    renderWithRouter(<LessonPage />, {
      route: "/lessons/arrays",
      path: "/lessons/:lessonId",
    });

    await screen.findByRole("heading", { level: 1, name: "Arrays" });
    await screen.findByLabelText("monaco-editor");

    expect(curriculumApi.getLessonFile).not.toHaveBeenCalledWith(
      "arrays",
      "solution",
    );
  });

  it("supports Lesson 12 multi-file source tabs", async () => {
    vi.mocked(curriculumApi.listCurriculum).mockResolvedValue(mockCurriculumResponse);
    vi.mocked(curriculumApi.getLesson).mockResolvedValue(mockLesson12);
    mockMultiFileResponses("header-files-and-multiple-source-files", mockLesson12);

    renderWithRouter(<LessonPage />, {
      route: "/lessons/header-files-and-multiple-source-files",
      path: "/lessons/:lessonId",
    });

    await screen.findByRole("heading", {
      name: "Header Files and Multiple Source Files",
    });

    expect(await screen.findByRole("tab", { name: "main.c" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "geometry.c" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "geometry.h" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "solution.c" })).not.toBeInTheDocument();
  });

  it("supports Lesson 14 multi-file source tabs", async () => {
    vi.mocked(curriculumApi.listCurriculum).mockResolvedValue(mockCurriculumResponse);
    vi.mocked(curriculumApi.getLesson).mockResolvedValue(mockLesson14);
    mockMultiFileResponses("intermediate-console-project", mockLesson14);

    renderWithRouter(<LessonPage />, {
      route: "/lessons/intermediate-console-project",
      path: "/lessons/:lessonId",
    });

    await screen.findByRole("heading", { name: "Intermediate Console Project" });

    for (const fileName of [
      "main.c",
      "task.c",
      "task.h",
      "store.c",
      "store.h",
      "util.c",
      "util.h",
    ]) {
      expect(await screen.findByRole("tab", { name: fileName })).toBeInTheDocument();
    }
  });

  it("follows curriculum sequence for previous and next navigation", async () => {
    vi.mocked(curriculumApi.listCurriculum).mockResolvedValue(mockCurriculumResponse);
    vi.mocked(curriculumApi.getLesson).mockResolvedValue(mockArraysLesson);
    mockArraysFiles();

    renderWithRouter(<LessonPage />, {
      route: "/lessons/arrays",
      path: "/lessons/:lessonId",
    });

    expect(
      await screen.findByRole("link", {
        name: "← Previous: Variables and Data Types",
      }),
    ).toHaveAttribute("href", "/lessons/variables-and-data-types");
    expect(
      screen.getByRole("link", {
        name: "Next: Header Files and Multiple Source Files →",
      }),
    ).toHaveAttribute("href", "/lessons/header-files-and-multiple-source-files");
  });

  it("has no previous link on the first curriculum entry", async () => {
    vi.mocked(curriculumApi.listCurriculum).mockResolvedValue(mockCurriculumResponse);
    vi.mocked(curriculumApi.getLesson).mockResolvedValue({
      ...mockArraysLesson,
      id: "basic-io",
      lessonNumber: 0,
      sequence: 0,
      title: "Basic IO",
    });
    vi.mocked(curriculumApi.getLessonFile).mockImplementation(
      async (_lessonId, fileId) => {
        if (fileId === "readme") {
          return { ...mockReadmeContent, lessonId: "basic-io" };
        }
        return { ...mockPrimarySourceContent, lessonId: "basic-io" };
      },
    );

    renderWithRouter(<LessonPage />, {
      route: "/lessons/basic-io",
      path: "/lessons/:lessonId",
    });

    await screen.findByRole("heading", { name: "Basic IO" });

    expect(screen.queryByText(/Previous:/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Next: Drawing Shapes →" }),
    ).toBeInTheDocument();
  });

  it("has no next link on the final curriculum entry", async () => {
    vi.mocked(curriculumApi.listCurriculum).mockResolvedValue(mockCurriculumResponse);
    vi.mocked(curriculumApi.getLesson).mockResolvedValue(mockLesson14);
    mockMultiFileResponses("intermediate-console-project", mockLesson14);

    renderWithRouter(<LessonPage />, {
      route: "/lessons/intermediate-console-project",
      path: "/lessons/:lessonId",
    });

    await screen.findByRole("heading", { name: "Intermediate Console Project" });

    expect(screen.queryByText(/Next:/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "← Previous: Header Files and Multiple Source Files",
      }),
    ).toBeInTheDocument();
  });

  it("shows a lesson-not-found state for unknown lessons", async () => {
    vi.mocked(curriculumApi.listCurriculum).mockResolvedValue(mockCurriculumResponse);
    vi.mocked(curriculumApi.getLesson).mockRejectedValue(
      new curriculumApi.CurriculumApiNotFoundError("Lesson not found"),
    );

    renderWithRouter(<LessonPage />, {
      route: "/lessons/does-not-exist",
      path: "/lessons/:lessonId",
    });

    expect(await screen.findByText("Lesson not found")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Return to curriculum" }),
    ).toHaveAttribute("href", "/");
  });

  it("links to visualizer for searching-and-sorting lesson", async () => {
    vi.mocked(curriculumApi.listCurriculum).mockResolvedValue(mockCurriculumResponse);
    vi.mocked(curriculumApi.getLesson).mockResolvedValue({
      ...mockArraysLesson,
      id: "searching-and-sorting",
      title: "Searching and Sorting",
    });
    vi.mocked(curriculumApi.getLessonFile).mockImplementation(
      async (_lessonId, fileId) => {
        if (fileId === "readme") {
          return { ...mockReadmeContent, lessonId: "searching-and-sorting" };
        }
        return { ...mockPrimarySourceContent, lessonId: "searching-and-sorting" };
      },
    );

    renderWithRouter(<LessonPage />, {
      route: "/lessons/searching-and-sorting",
      path: "/lessons/:lessonId",
    });

    expect(
      await screen.findByRole("link", { name: "Open Visualizer" }),
    ).toHaveAttribute("href", "/lessons/searching-and-sorting/visualize");
  });

  it("shows a retryable lesson load failure", async () => {
    const user = userEvent.setup();
    vi.mocked(curriculumApi.listCurriculum)
      .mockRejectedValueOnce(new curriculumApi.CurriculumApiError("boom"))
      .mockResolvedValue(mockCurriculumResponse);
    vi.mocked(curriculumApi.getLesson).mockResolvedValue(mockArraysLesson);
    mockArraysFiles();

    renderWithRouter(<LessonPage />, {
      route: "/lessons/arrays",
      path: "/lessons/:lessonId",
    });

    expect(await screen.findByText("Unable to load lesson")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Arrays" }),
    ).toBeInTheDocument();
  });
});
