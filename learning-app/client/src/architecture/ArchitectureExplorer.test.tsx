import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as architectureApi from "../api/architecture-api";
import * as curriculumApi from "../api/curriculum-api";
import { ArchitectureExplorer } from "../architecture/ArchitectureExplorer";
import { LessonArchitecturePage } from "../pages/LessonArchitecturePage";
import { LessonPage } from "../pages/LessonPage";
import {
  mockCurriculumResponse,
  mockLesson12,
  mockLesson14,
} from "../test-fixtures/curriculum";
import { renderWithRouter } from "../test-utils";
import type { LessonArchitectureResponse } from "@learning-app/shared";

vi.mock("../api/architecture-api");
vi.mock("../api/curriculum-api");
vi.mock("../api/persistence-api", () => ({
  visitLesson: vi.fn(async (lessonId: string) => ({
    lessonId,
    status: "in_progress" as const,
    lastVisitedAt: "2026-01-01T00:00:00.000Z",
    completedAt: null,
    updatedAt: "2026-01-01T00:00:00.000Z",
  })),
  getLessonDrafts: vi.fn(async (lessonId: string) => ({ lessonId, drafts: [] })),
  updateLessonProgress: vi.fn(),
  PersistenceApiError: class extends Error {},
  PersistenceApiUnavailableError: class extends Error {},
}));
vi.mock("../api/labs-api", () => ({
  listLessonLabs: vi.fn(async () => []),
}));

const mockLesson12Architecture: LessonArchitectureResponse = {
  lessonId: "header-files-and-multiple-source-files",
  lessonTitle: "Header Files and Multiple Source Files",
  isCapstone: false,
  files: [
    {
      fileId: "primary",
      name: "main.c",
      role: "primary",
      kind: "source",
      responsibility: "Entry point",
    },
    {
      fileId: "geometry",
      name: "geometry.c",
      role: "support",
      kind: "source",
      responsibility: "Implementation",
    },
    {
      fileId: "geometry-header",
      name: "geometry.h",
      role: "header",
      kind: "header",
      responsibility: "Public contract",
    },
  ],
  includes: [
    {
      fromFileId: "primary",
      toFileId: "geometry-header",
      includeName: "geometry.h",
    },
    {
      fromFileId: "geometry",
      toFileId: "geometry-header",
      includeName: "geometry.h",
    },
  ],
  includeGuards: [{ fileId: "geometry-header", macro: "GEOMETRY_H" }],
  modules: [
    {
      id: "geometry",
      label: "geometry module",
      fileIds: ["geometry", "geometry-header"],
      responsibility: "Geometry helpers",
      publicConcepts: ["Rect", "rect_area"],
    },
  ],
  ownership: [],
  resources: [],
  build: {
    sourceFileIds: ["primary", "geometry"],
    translationUnits: [
      {
        sourceFileId: "primary",
        sourceFileName: "main.c",
        includedHeaderFileIds: ["geometry-header"],
        objectFileLabel: "main.o",
      },
      {
        sourceFileId: "geometry",
        sourceFileName: "geometry.c",
        includedHeaderFileIds: ["geometry-header"],
        objectFileLabel: "geometry.o",
      },
    ],
    linkFlags: ["-lm"],
    outputLabel: "geometry_demo.exe",
  },
  buildPipelineStages: [
    {
      id: "link",
      label: "Linker produces executable",
      narration: "Link objects.",
      highlights: ["geometry_demo.exe"],
    },
  ],
  buildMistakes: [
    {
      id: "omit-geometry-c",
      title: "geometry.c omitted from the link",
      description: "Undefined references at link time.",
      category: "link",
    },
  ],
  workflows: [],
  solutionOmittedNote:
    "Reference solution is an alternate entry point and is intentionally omitted from this architecture view.",
};

const mockCapstoneArchitecture: LessonArchitectureResponse = {
  ...mockLesson12Architecture,
  lessonId: "intermediate-console-project",
  lessonTitle: "Intermediate Console Project",
  isCapstone: true,
  files: [
    {
      fileId: "primary",
      name: "main.c",
      role: "primary",
      kind: "source",
      responsibility: "Menu loop",
    },
    {
      fileId: "store-header",
      name: "store.h",
      role: "header",
      kind: "header",
      responsibility: "Store API",
    },
  ],
  includes: [
    {
      fromFileId: "primary",
      toFileId: "store-header",
      includeName: "store.h",
    },
  ],
  modules: [
    {
      id: "main",
      label: "MAIN",
      fileIds: ["primary"],
      responsibility: "Orchestration",
      publicConcepts: ["main"],
    },
    {
      id: "store",
      label: "STORE",
      fileIds: ["store", "store-header"],
      responsibility: "TaskStore",
      publicConcepts: ["TaskStore", "store_add"],
    },
  ],
  ownership: [
    {
      ownerModuleId: "store",
      resourceId: "taskstore-items",
      label: "TaskStore.items heap array",
      description: "Store owns count, capacity, and next_id.",
    },
  ],
  resources: [
    {
      id: "tasks-txt",
      label: "tasks.txt",
      description: "Persistence file, not a compile input.",
      format: "id|status|priority|title",
    },
  ],
  build: {
    sourceFileIds: ["primary", "task", "store", "util"],
    translationUnits: [
      {
        sourceFileId: "primary",
        sourceFileName: "main.c",
        includedHeaderFileIds: ["store-header"],
        objectFileLabel: "main.o",
      },
    ],
    linkFlags: [],
    outputLabel: "task_tracker.exe",
  },
  buildPipelineStages: [
    {
      id: "link",
      label: "Linker produces executable",
      narration: "Combine objects.",
      highlights: ["task_tracker.exe"],
    },
  ],
  workflows: [
    {
      id: "add-task",
      title: "Add Task",
      moduleCollaborationNote:
        "This trace shows module collaboration, not a live execution of your program.",
      steps: [
        {
          id: "step-1",
          label: "User action",
          moduleId: "main",
          narration: "main handles add.",
        },
        {
          id: "step-2",
          label: "store_add",
          moduleId: "store",
          symbol: "store_add",
          narration: "Store appends task.",
        },
      ],
    },
  ],
};

describe("architecture client", () => {
  beforeEach(() => {
    vi.mocked(curriculumApi.getLessonFile).mockResolvedValue({
      lessonId: "header-files-and-multiple-source-files",
      file: mockLesson12.files[1]!,
      content: "int main() {}",
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("Lesson 12 links to architecture explorer", async () => {
    vi.mocked(curriculumApi.listCurriculum).mockResolvedValue(mockCurriculumResponse);
    vi.mocked(curriculumApi.getLesson).mockResolvedValue(mockLesson12);
    vi.mocked(curriculumApi.getLessonFile).mockImplementation(async (_id, fileId) => ({
      lessonId: "header-files-and-multiple-source-files",
      file: mockLesson12.files.find((file) => file.id === fileId)!,
      content: "# Lesson",
    }));

    renderWithRouter(<LessonPage />, {
      route: "/lessons/header-files-and-multiple-source-files",
      path: "/lessons/:lessonId",
    });

    expect(
      await screen.findByRole("link", { name: "Explore Architecture" }),
    ).toHaveAttribute("href", "/lessons/header-files-and-multiple-source-files/architecture");
  });

  it("capstone links to architecture explorer", async () => {
    vi.mocked(curriculumApi.listCurriculum).mockResolvedValue(mockCurriculumResponse);
    vi.mocked(curriculumApi.getLesson).mockResolvedValue(mockLesson14);
    vi.mocked(curriculumApi.getLessonFile).mockImplementation(async (_id, fileId) => ({
      lessonId: "intermediate-console-project",
      file: mockLesson14.files.find((file) => file.id === fileId)!,
      content: "# Lesson",
    }));

    renderWithRouter(<LessonPage />, {
      route: "/lessons/intermediate-console-project",
      path: "/lessons/:lessonId",
    });

    expect(
      await screen.findByRole("link", { name: "Explore Architecture" }),
    ).toHaveAttribute("href", "/lessons/intermediate-console-project/architecture");
  });

  it("renders lesson 12 architecture route", async () => {
    vi.mocked(architectureApi.getLessonArchitecture).mockResolvedValue(
      mockLesson12Architecture,
    );

    renderWithRouter(<LessonArchitecturePage />, {
      route: "/lessons/header-files-and-multiple-source-files/architecture",
      path: "/lessons/:lessonId/architecture",
    });

    expect(
      await screen.findByRole("heading", {
        name: "Header Files and Multiple Source Files",
      }),
    ).toBeInTheDocument();
  });

  it("shows conceptual/source-of-truth notice", () => {
    renderWithRouter(
      <ArchitectureExplorer architecture={mockLesson12Architecture} />,
    );

    expect(
      screen.getByText(/does not dynamically analyze your edited C source/i),
    ).toBeInTheDocument();
  });

  it("renders dependency graph textual equivalents and node selection", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <ArchitectureExplorer architecture={mockLesson12Architecture} />,
    );

    const relationships = screen.getByLabelText("Include relationships");
    expect(relationships).toHaveTextContent("main.c includes geometry.h");
    expect(relationships).toHaveTextContent("geometry.h");
    await user.click(screen.getByRole("option", { name: "geometry.h" }));
    expect(
      screen.getByRole("heading", { level: 3, name: "geometry.h" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/#ifndef GEOMETRY_H/i)).toBeInTheDocument();
  });

  it("build pipeline playback controls render", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <ArchitectureExplorer architecture={mockLesson12Architecture} />,
    );

    await user.click(screen.getByRole("tab", { name: "Build Pipeline" }));
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });

  it("solution unavailable from architecture file selector", () => {
    renderWithRouter(
      <ArchitectureExplorer architecture={mockLesson12Architecture} />,
    );

    expect(screen.queryByRole("option", { name: "solution.c" })).not.toBeInTheDocument();
  });

  it("ownership panel and workflow explorer render for capstone", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <ArchitectureExplorer architecture={mockCapstoneArchitecture} />,
    );

    await user.click(screen.getByRole("tab", { name: "Data Ownership" }));
    expect(screen.getByText(/TaskStore.items heap array/i)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Runtime Workflows" }));
    expect(screen.getByRole("tab", { name: "Add Task" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeInTheDocument();
  });

  it("loads read-only source for selected file", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <ArchitectureExplorer architecture={mockLesson12Architecture} />,
    );

    await user.click(screen.getByRole("option", { name: "main.c" }));
    expect(await screen.findByText(/read-only/i)).toBeInTheDocument();
    expect(curriculumApi.getLessonFile).toHaveBeenCalledWith(
      "header-files-and-multiple-source-files",
      "primary",
    );
  });
});
