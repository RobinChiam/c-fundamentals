import type { ReactElement } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as compilerApi from "../api/compiler-api";
import { CompilerPanel } from "./CompilerPanel";
import type { LessonWorkspace } from "../workspace/workspace-types";

vi.mock("../api/compiler-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/compiler-api")>();
  return {
    ...actual,
    getCompilerStatus: vi.fn(),
    compileLesson: vi.fn(),
  };
});

const workspace: LessonWorkspace = {
  lessonId: "arrays",
  activeFileId: "primary",
  viewMode: "edit",
  files: [
    {
      id: "primary",
      name: "arrays.c",
      role: "primary",
      language: "c",
      originalContent: "original",
      draftContent: "draft content",
    },
  ],
};

function renderPanel(ui: ReactElement) {
  return render(ui);
}

describe("CompilerPanel", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders success state", async () => {
    vi.mocked(compilerApi.getCompilerStatus).mockResolvedValue({
      available: true,
      compiler: "gcc",
      version: "gcc (GCC) 14.0.0",
    });
    vi.mocked(compilerApi.compileLesson).mockResolvedValue({
      outcome: "success",
      exitCode: 0,
      stdout: "",
      stderr: "",
      stdoutTruncated: false,
      stderrTruncated: false,
      diagnostics: [],
    });

    const user = userEvent.setup();
    renderPanel(<CompilerPanel lessonId="arrays" workspace={workspace} />);

    await user.click(await screen.findByRole("button", { name: "Compile" }));

    expect(await screen.findByText("Build successful")).toBeInTheDocument();
  });

  it("renders failed diagnostics", async () => {
    vi.mocked(compilerApi.getCompilerStatus).mockResolvedValue({
      available: true,
      compiler: "gcc",
      version: "gcc (GCC) 14.0.0",
    });
    vi.mocked(compilerApi.compileLesson).mockResolvedValue({
      outcome: "failed",
      exitCode: 1,
      stdout: "",
      stderr: "arrays.c:1:1: error: expected identifier",
      stdoutTruncated: false,
      stderrTruncated: false,
      diagnostics: [
        {
          severity: "error",
          fileName: "arrays.c",
          fileId: "primary",
          line: 1,
          column: 1,
          message: "expected identifier",
        },
      ],
    });

    const user = userEvent.setup();
    renderPanel(<CompilerPanel lessonId="arrays" workspace={workspace} />);
    await user.click(await screen.findByRole("button", { name: "Compile" }));

    expect(await screen.findByText("Build failed")).toBeInTheDocument();
    expect(screen.getByText("expected identifier")).toBeInTheDocument();
    expect(screen.getByText("Raw compiler output")).toBeInTheDocument();
  });

  it("renders timeout state", async () => {
    vi.mocked(compilerApi.getCompilerStatus).mockResolvedValue({
      available: true,
      compiler: "gcc",
      version: "gcc (GCC) 14.0.0",
    });
    vi.mocked(compilerApi.compileLesson).mockResolvedValue({
      outcome: "timeout",
      exitCode: null,
      stdout: "",
      stderr: "",
      stdoutTruncated: false,
      stderrTruncated: false,
      diagnostics: [],
    });

    const user = userEvent.setup();
    renderPanel(<CompilerPanel lessonId="arrays" workspace={workspace} />);
    await user.click(await screen.findByRole("button", { name: "Compile" }));

    expect(await screen.findByText("Compilation timed out")).toBeInTheDocument();
  });

  it("renders unavailable state and disables compile", async () => {
    vi.mocked(compilerApi.getCompilerStatus).mockResolvedValue({
      available: false,
      compiler: "gcc",
      version: null,
    });

    renderPanel(<CompilerPanel lessonId="arrays" workspace={workspace} />);

    expect(await screen.findByText("GCC unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Compile" })).toBeDisabled();
  });

  it("submits full workspace drafts and does not mutate them", async () => {
    vi.mocked(compilerApi.getCompilerStatus).mockResolvedValue({
      available: true,
      compiler: "gcc",
      version: "gcc (GCC) 14.0.0",
    });
    vi.mocked(compilerApi.compileLesson).mockResolvedValue({
      outcome: "success",
      exitCode: 0,
      stdout: "",
      stderr: "",
      stdoutTruncated: false,
      stderrTruncated: false,
      diagnostics: [],
    });

    const mutableWorkspace = structuredClone(workspace);
    const user = userEvent.setup();
    renderPanel(<CompilerPanel lessonId="arrays" workspace={mutableWorkspace} />);
    await user.click(await screen.findByRole("button", { name: "Compile" }));

    expect(compilerApi.compileLesson).toHaveBeenCalledWith("arrays", {
      files: [{ id: "primary", content: "draft content" }],
    });
    expect(mutableWorkspace.files[0]?.draftContent).toBe("draft content");
    expect(mutableWorkspace.files[0]?.originalContent).toBe("original");
  });

  it("guards duplicate compile actions while compiling", async () => {
    vi.mocked(compilerApi.getCompilerStatus).mockResolvedValue({
      available: true,
      compiler: "gcc",
      version: "gcc (GCC) 14.0.0",
    });

    const deferred: {
      resolve?: (value: Awaited<ReturnType<typeof compilerApi.compileLesson>>) => void;
    } = {};
    vi.mocked(compilerApi.compileLesson).mockImplementation(
      () =>
        new Promise((resolve) => {
          deferred.resolve = resolve;
        }),
    );

    const user = userEvent.setup();
    renderPanel(<CompilerPanel lessonId="arrays" workspace={workspace} />);

    const button = await screen.findByRole("button", { name: "Compile" });
    await user.click(button);

    expect(await screen.findByRole("button", { name: "Compiling…" })).toBeDisabled();

    deferred.resolve?.({
      outcome: "success",
      exitCode: 0,
      stdout: "",
      stderr: "",
      stdoutTruncated: false,
      stderrTruncated: false,
      diagnostics: [],
    });

    await waitFor(() => {
      expect(compilerApi.compileLesson).toHaveBeenCalledTimes(1);
    });
  });
});
