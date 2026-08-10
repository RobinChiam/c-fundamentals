import type { ReactElement } from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as curriculumApi from "../../api/curriculum-api";
import * as persistenceApi from "../../api/persistence-api";
import { CodeWorkspace } from "./CodeWorkspace";
import { WorkspaceProvider } from "../../workspace/WorkspaceProvider";
import { DRAFT_AUTOSAVE_DEBOUNCE_MS } from "../../workspace/draft-persistence-types";
import {
  mockArraysLesson,
  mockPrimarySourceContent,
} from "../../test-fixtures/curriculum";

vi.mock("../../api/curriculum-api");
vi.mock("../../api/persistence-api");
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

function mockArraysWorkspace() {
  vi.mocked(curriculumApi.getLessonFile).mockImplementation(
    async (_lessonId, fileId) => {
      if (fileId === "primary") {
        return mockPrimarySourceContent;
      }
      throw new curriculumApi.CurriculumApiError("missing");
    },
  );
}

describe("CodeWorkspace persistence", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(persistenceApi.getLessonDrafts).mockResolvedValue({
      lessonId: "arrays",
      drafts: [],
    });
    vi.mocked(persistenceApi.saveLessonDraft).mockResolvedValue({
      lessonId: "arrays",
      fileId: "primary",
      content: "draft change",
      updatedAt: "2026-01-01T00:00:00.000Z",
      stale: false,
    });
    vi.mocked(persistenceApi.deleteLessonDraft).mockResolvedValue(undefined);
    vi.mocked(persistenceApi.deleteLessonDrafts).mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("non-stale saved draft hydrates", async () => {
    mockArraysWorkspace();
    vi.mocked(persistenceApi.getLessonDrafts).mockResolvedValue({
      lessonId: "arrays",
      drafts: [
        {
          lessonId: "arrays",
          fileId: "primary",
          content: "restored draft",
          updatedAt: "2026-01-01T00:00:00.000Z",
          stale: false,
        },
      ],
    });

    renderWorkspace(<CodeWorkspace lessonId="arrays" files={mockArraysLesson.files} />);

    const editor = await screen.findByLabelText("monaco-editor");
    expect(editor).toHaveValue("restored draft");
  });

  it("stale draft does not auto-hydrate", async () => {
    mockArraysWorkspace();
    vi.mocked(persistenceApi.getLessonDrafts).mockResolvedValue({
      lessonId: "arrays",
      drafts: [
        {
          lessonId: "arrays",
          fileId: "primary",
          content: "old saved draft",
          updatedAt: "2026-01-01T00:00:00.000Z",
          stale: true,
        },
      ],
    });

    renderWorkspace(<CodeWorkspace lessonId="arrays" files={mockArraysLesson.files} />);

    const editor = await screen.findByLabelText("monaco-editor");
    expect(editor).toHaveValue(mockPrimarySourceContent.content);
    expect(screen.getByText("Saved draft needs review")).toBeInTheDocument();
  });

  it("stale draft Use action works", async () => {
    const user = userEvent.setup();
    mockArraysWorkspace();
    vi.mocked(persistenceApi.getLessonDrafts).mockResolvedValue({
      lessonId: "arrays",
      drafts: [
        {
          lessonId: "arrays",
          fileId: "primary",
          content: "old saved draft",
          updatedAt: "2026-01-01T00:00:00.000Z",
          stale: true,
        },
      ],
    });

    renderWorkspace(<CodeWorkspace lessonId="arrays" files={mockArraysLesson.files} />);

    await user.click(await screen.findByRole("button", { name: "Use Saved Draft" }));

    expect(await screen.findByLabelText("monaco-editor")).toHaveValue(
      "old saved draft",
    );
    expect(screen.queryByText("Saved draft needs review")).not.toBeInTheDocument();
  });

  it("stale draft Discard works", async () => {
    const user = userEvent.setup();
    mockArraysWorkspace();
    vi.mocked(persistenceApi.getLessonDrafts).mockResolvedValue({
      lessonId: "arrays",
      drafts: [
        {
          lessonId: "arrays",
          fileId: "primary",
          content: "old saved draft",
          updatedAt: "2026-01-01T00:00:00.000Z",
          stale: true,
        },
      ],
    });

    renderWorkspace(<CodeWorkspace lessonId="arrays" files={mockArraysLesson.files} />);

    await user.click(await screen.findByRole("button", { name: "Discard Saved Draft" }));

    expect(persistenceApi.deleteLessonDraft).toHaveBeenCalledWith(
      "arrays",
      "primary",
    );
    expect(screen.queryByText("Saved draft needs review")).not.toBeInTheDocument();
  });

  it("edit updates workspace immediately before save completes", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockArraysWorkspace();

    renderWorkspace(<CodeWorkspace lessonId="arrays" files={mockArraysLesson.files} />);

    const editor = await screen.findByLabelText("monaco-editor");
    await user.clear(editor);
    await user.type(editor, "immediate");

    expect(editor).toHaveValue("immediate");
    expect(persistenceApi.saveLessonDraft).not.toHaveBeenCalled();
  });

  it("save is debounced", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockArraysWorkspace();

    renderWorkspace(<CodeWorkspace lessonId="arrays" files={mockArraysLesson.files} />);

    const editor = await screen.findByLabelText("monaco-editor");
    await user.clear(editor);
    await user.type(editor, "draft change");

    expect(persistenceApi.saveLessonDraft).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(DRAFT_AUTOSAVE_DEBOUNCE_MS);
    });

    await waitFor(() => {
      expect(persistenceApi.saveLessonDraft).toHaveBeenCalledWith(
        "arrays",
        "primary",
        "draft change",
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });
  });

  it("Saved indicator occurs only after persistence success", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockArraysWorkspace();

    renderWorkspace(<CodeWorkspace lessonId="arrays" files={mockArraysLesson.files} />);

    const editor = await screen.findByLabelText("monaco-editor");
    await user.clear(editor);
    await user.type(editor, "draft change");

    expect(screen.queryByText(/Draft persistence: Saved/i)).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(DRAFT_AUTOSAVE_DEBOUNCE_MS);
    });

    await waitFor(() => {
      expect(screen.getByText(/Draft persistence: Saved/i)).toBeInTheDocument();
    });
  });

  it("failed save keeps current in-memory content", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockArraysWorkspace();
    vi.mocked(persistenceApi.saveLessonDraft).mockRejectedValue(
      new persistenceApi.PersistenceApiError("boom"),
    );

    renderWorkspace(<CodeWorkspace lessonId="arrays" files={mockArraysLesson.files} />);

    const editor = await screen.findByLabelText("monaco-editor");
    await user.clear(editor);
    await user.type(editor, "kept draft");

    await act(async () => {
      vi.advanceTimersByTime(DRAFT_AUTOSAVE_DEBOUNCE_MS);
    });

    await waitFor(() => {
      expect(screen.getByText(/Draft persistence: Save failed/i)).toBeInTheDocument();
    });
    expect(editor).toHaveValue("kept draft");
  });

  it("Reset File deletes persisted draft", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockArraysWorkspace();

    renderWorkspace(<CodeWorkspace lessonId="arrays" files={mockArraysLesson.files} />);

    const editor = await screen.findByLabelText("monaco-editor");
    await user.clear(editor);
    await user.type(editor, "draft change");
    await user.click(screen.getByRole("button", { name: "Reset file" }));

    expect(editor).toHaveValue(mockPrimarySourceContent.content);
    expect(persistenceApi.deleteLessonDraft).toHaveBeenCalledWith(
      "arrays",
      "primary",
    );
  });

  it("Reset All deletes all persisted lesson drafts", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const confirmMock = vi.fn().mockReturnValue(true);
    vi.stubGlobal("confirm", confirmMock);
    mockArraysWorkspace();

    renderWorkspace(<CodeWorkspace lessonId="arrays" files={mockArraysLesson.files} />);

    const editor = await screen.findByLabelText("monaco-editor");
    await user.clear(editor);
    await user.type(editor, "draft change");
    await user.click(screen.getByRole("button", { name: "Reset all" }));

    expect(persistenceApi.deleteLessonDrafts).toHaveBeenCalledWith("arrays");
    expect(editor).toHaveValue(mockPrimarySourceContent.content);
  });
});
