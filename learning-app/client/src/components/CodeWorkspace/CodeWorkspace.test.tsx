import type { ReactElement } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as curriculumApi from "../../api/curriculum-api";
import * as persistenceApi from "../../api/persistence-api";
import { CodeWorkspace } from "./CodeWorkspace";
import { WorkspaceProvider } from "../../workspace/WorkspaceProvider";
import {
  mockArraysLesson,
  mockGeometrySourceContent,
  mockLesson12,
  mockLesson14,
  mockPrimarySourceContent,
} from "../../test-fixtures/curriculum";

vi.mock("../../api/curriculum-api");
vi.mock("../../api/persistence-api");

function mockPersistenceDefaults() {
  vi.mocked(persistenceApi.getLessonDrafts).mockImplementation(
    async (lessonId: string) => ({
      lessonId,
      drafts: [],
    }),
  );
  vi.mocked(persistenceApi.saveLessonDraft).mockResolvedValue({
    lessonId: "arrays",
    fileId: "primary",
    content: "draft",
    updatedAt: "2026-01-01T00:00:00.000Z",
    stale: false,
  });
  vi.mocked(persistenceApi.deleteLessonDraft).mockResolvedValue(undefined);
  vi.mocked(persistenceApi.deleteLessonDrafts).mockResolvedValue(undefined);
}

vi.mock("../../api/compiler-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../api/compiler-api")>();
  return {
    ...actual,
    getCompilerStatus: vi.fn().mockResolvedValue({
      available: true,
      compiler: "gcc",
      version: "gcc (GCC) 14.0.0",
    }),
    compileLesson: vi.fn(),
  };
});

vi.mock("../../api/runner-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../api/runner-api")>();
  return {
    ...actual,
    getRunnerStatus: vi.fn().mockResolvedValue({
      available: true,
      runtime: "docker",
      image: "gcc:15.3.0-trixie",
      reason: null,
    }),
    runLesson: vi.fn(),
  };
});

vi.mock("../../runner/RuntimeTerminal", () => ({
  RuntimeTerminal: () => <div aria-label="Program output terminal" />,
}));

function renderWorkspace(ui: ReactElement) {
  return render(<WorkspaceProvider>{ui}</WorkspaceProvider>);
}

function mockLessonFileResponses() {
  vi.mocked(curriculumApi.getLessonFile).mockImplementation(
    async (lessonId, fileId) => {
      if (lessonId === "arrays" && fileId === "primary") {
        return mockPrimarySourceContent;
      }

      if (fileId === "geometry") {
        return mockGeometrySourceContent;
      }

      const lesson12File = mockLesson12.files.find((file) => file.id === fileId);
      if (lesson12File) {
        return {
          lessonId: "header-files-and-multiple-source-files",
          file: lesson12File,
          content: `content:${fileId}`,
        };
      }

      const lesson14File = mockLesson14.files.find((file) => file.id === fileId);
      if (lesson14File) {
        return {
          lessonId: "intermediate-console-project",
          file: lesson14File,
          content: `content:${fileId}`,
        };
      }

      throw new curriculumApi.CurriculumApiError("missing");
    },
  );
}

describe("CodeWorkspace", () => {
  beforeEach(() => {
    mockPersistenceDefaults();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.stubGlobal("confirm", undefined);
  });

  it("renders eligible file tabs without solution", async () => {
    mockLessonFileResponses();

    renderWorkspace(
      <CodeWorkspace
        lessonId="header-files-and-multiple-source-files"
        files={mockLesson12.files}
      />,
    );

    expect(await screen.findByRole("tab", { name: "main.c" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "geometry.c" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "geometry.h" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "solution.c" })).not.toBeInTheDocument();
  });

  it("selects the primary file initially", async () => {
    mockLessonFileResponses();

    renderWorkspace(<CodeWorkspace lessonId="arrays" files={mockArraysLesson.files} />);

    const editor = await screen.findByLabelText("monaco-editor");
    expect(editor).toHaveValue(mockPrimarySourceContent.content);
    expect(screen.getByRole("tab", { name: "arrays.c" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("never requests solution content during workspace initialization", async () => {
    mockLessonFileResponses();

    renderWorkspace(<CodeWorkspace lessonId="arrays" files={mockArraysLesson.files} />);

    await screen.findByLabelText("monaco-editor");

    expect(curriculumApi.getLessonFile).not.toHaveBeenCalledWith(
      "arrays",
      "solution",
    );
  });

  it("updates the draft when the editor changes", async () => {
    const user = userEvent.setup();
    mockLessonFileResponses();

    renderWorkspace(<CodeWorkspace lessonId="arrays" files={mockArraysLesson.files} />);

    const editor = await screen.findByLabelText("monaco-editor");
    await user.clear(editor);
    await user.type(editor, "draft change");

    expect(editor).toHaveValue("draft change");
    expect(screen.getByText("1 modified file")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /arrays\.c/ })).toHaveTextContent("●");
  });

  it("shows the correct draft when switching tabs", async () => {
    const user = userEvent.setup();
    mockLessonFileResponses();

    renderWorkspace(
      <CodeWorkspace
        lessonId="header-files-and-multiple-source-files"
        files={mockLesson12.files}
      />,
    );

    const editor = await screen.findByLabelText("monaco-editor");
    await user.clear(editor);
    await user.type(editor, "edited main");

    await user.click(screen.getByRole("tab", { name: "geometry.c" }));
    expect(await screen.findByLabelText("monaco-editor")).toHaveValue(
      "/* geometry.c */\n",
    );

    await user.click(screen.getByRole("tab", { name: /main\.c/ }));
    expect(await screen.findByLabelText("monaco-editor")).toHaveValue("edited main");
  });

  it("switches between edit and compare modes", async () => {
    const user = userEvent.setup();
    mockLessonFileResponses();

    renderWorkspace(<CodeWorkspace lessonId="arrays" files={mockArraysLesson.files} />);

    const editor = await screen.findByLabelText("monaco-editor");
    await user.clear(editor);
    await user.type(editor, "draft change");

    await user.click(screen.getByRole("button", { name: "Compare" }));

    expect(screen.getByTestId("monaco-diff")).toBeInTheDocument();
    expect(screen.getByTestId("diff-original").textContent).toContain(
      "Lesson 6 — Arrays",
    );
    expect(screen.getByTestId("diff-modified")).toHaveTextContent("draft change");
    expect(screen.queryByLabelText("monaco-editor")).not.toBeInTheDocument();
  });

  it("resets the active file", async () => {
    const user = userEvent.setup();
    mockLessonFileResponses();

    renderWorkspace(<CodeWorkspace lessonId="arrays" files={mockArraysLesson.files} />);

    const editor = await screen.findByLabelText("monaco-editor");
    await user.clear(editor);
    await user.type(editor, "draft change");

    await user.click(screen.getByRole("button", { name: "Reset file" }));

    expect(editor).toHaveValue(mockPrimarySourceContent.content);
  });

  it("resets all files after confirmation", async () => {
    const user = userEvent.setup();
    const confirmMock = vi.fn().mockReturnValue(true);
    vi.stubGlobal("confirm", confirmMock);
    mockLessonFileResponses();

    renderWorkspace(
      <CodeWorkspace
        lessonId="header-files-and-multiple-source-files"
        files={mockLesson12.files}
      />,
    );

    const editor = await screen.findByLabelText("monaco-editor");
    await user.clear(editor);
    await user.type(editor, "edited main");

    await user.click(screen.getByRole("button", { name: "Reset all" }));
    expect(confirmMock).toHaveBeenCalled();
    expect(editor).toHaveValue("content:primary");
    expect(screen.getByText("No modified files")).toBeInTheDocument();
  });

  it("shows draft persistence status", async () => {
    mockLessonFileResponses();

    renderWorkspace(<CodeWorkspace lessonId="arrays" files={mockArraysLesson.files} />);

    expect(
      await screen.findByText(/Draft persistence: Saved/i),
    ).toBeInTheDocument();
  });

  it("shows a controlled failure state when workspace loading fails", async () => {
    vi.mocked(curriculumApi.getLessonFile).mockRejectedValue(
      new curriculumApi.CurriculumApiError("boom"),
    );

    renderWorkspace(<CodeWorkspace lessonId="arrays" files={mockArraysLesson.files} />);

    expect(
      await screen.findByText("Unable to load code workspace"),
    ).toBeInTheDocument();
  });

  it("supports Lesson 14 multi-file tabs", async () => {
    mockLessonFileResponses();

    renderWorkspace(
      <CodeWorkspace
        lessonId="intermediate-console-project"
        files={mockLesson14.files}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "main.c" })).toBeInTheDocument();
    });

    for (const fileName of [
      "main.c",
      "task.c",
      "task.h",
      "store.c",
      "store.h",
      "util.c",
      "util.h",
    ]) {
      expect(screen.getByRole("tab", { name: fileName })).toBeInTheDocument();
    }
  });
});
