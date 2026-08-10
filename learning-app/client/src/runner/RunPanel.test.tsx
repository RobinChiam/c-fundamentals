import type { ReactElement } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as compilerApi from "../api/compiler-api";
import * as runnerApi from "../api/runner-api";
import { RunPanel } from "./RunPanel";
import type { LessonWorkspace } from "../workspace/workspace-types";

vi.mock("../api/compiler-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/compiler-api")>();
  return {
    ...actual,
    getCompilerStatus: vi.fn(),
    compileLesson: vi.fn(),
  };
});

vi.mock("../api/runner-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/runner-api")>();
  return {
    ...actual,
    getRunnerStatus: vi.fn(),
    runLesson: vi.fn(),
  };
});

vi.mock("./RuntimeTerminal", () => ({
  RuntimeTerminal: ({
    execution,
  }: {
    execution: { stdout?: string; outcome?: string } | null;
  }) => (
    <div aria-label="Program output terminal">
      {execution ? `${execution.stdout ?? ""}:${execution.outcome ?? ""}` : "empty"}
    </div>
  ),
}));

const workspace: LessonWorkspace = {
  lessonId: "arrays",
  activeFileId: "primary",
  viewMode: "edit",
  saveStatus: "saved",
  staleDrafts: [],
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

describe("RunPanel", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.mocked(compilerApi.getCompilerStatus).mockResolvedValue({
      available: true,
      compiler: "gcc",
      version: "gcc (GCC) 14.0.0",
    });
    vi.mocked(runnerApi.getRunnerStatus).mockResolvedValue({
      available: true,
      runtime: "docker",
      image: "gcc:15.3.0-trixie",
      reason: null,
    });
  });

  it("renders runner unavailable state", async () => {
    vi.mocked(runnerApi.getRunnerStatus).mockResolvedValue({
      available: false,
      runtime: "docker",
      image: "gcc:15.3.0-trixie",
      reason: "image_missing",
    });

    renderPanel(<RunPanel lessonId="arrays" workspace={workspace} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Run" })).toBeDisabled();
    });
    expect(screen.getByText(/Run: Runner unavailable/)).toBeInTheDocument();
    expect(screen.getByText(/docker pull gcc:15.3.0-trixie/)).toBeInTheDocument();
  });

  it("renders running and success states", async () => {
    const deferred: {
      resolve?: (value: Awaited<ReturnType<typeof runnerApi.runLesson>>) => void;
    } = {};
    vi.mocked(runnerApi.runLesson).mockImplementation(
      () =>
        new Promise((resolve) => {
          deferred.resolve = resolve;
        }),
    );

    const user = userEvent.setup();
    renderPanel(<RunPanel lessonId="arrays" workspace={workspace} />);

    await user.type(screen.getByLabelText("Program input"), "abc\n");
    await user.click(await screen.findByRole("button", { name: "Run" }));

    expect(await screen.findByRole("button", { name: "Running…" })).toBeDisabled();
    expect(screen.getByText(/Run: Running/)).toBeInTheDocument();

    deferred.resolve?.({
      compile: {
        outcome: "success",
        exitCode: 0,
        stdout: "",
        stderr: "",
        stdoutTruncated: false,
        stderrTruncated: false,
        diagnostics: [],
      },
      execution: {
        outcome: "success",
        exitCode: 0,
        stdout: "hello\n",
        stderr: "",
        stdoutTruncated: false,
        stderrTruncated: false,
        durationMs: 5,
      },
    });

    expect(await screen.findByText(/Run: Program finished/)).toBeInTheDocument();
    expect(screen.getByLabelText("Program output terminal")).toHaveTextContent(
      "hello :success",
    );
  });

  it("submits full draft workspace and stdin without mutating drafts", async () => {
    vi.mocked(runnerApi.runLesson).mockResolvedValue({
      compile: {
        outcome: "success",
        exitCode: 0,
        stdout: "",
        stderr: "",
        stdoutTruncated: false,
        stderrTruncated: false,
        diagnostics: [],
      },
      execution: {
        outcome: "success",
        exitCode: 0,
        stdout: "",
        stderr: "",
        stdoutTruncated: false,
        stderrTruncated: false,
        durationMs: 1,
      },
    });

    const mutableWorkspace = structuredClone(workspace);
    const user = userEvent.setup();
    renderPanel(<RunPanel lessonId="arrays" workspace={mutableWorkspace} />);

    await user.type(screen.getByLabelText("Program input"), "1\n2\n");
    await user.click(await screen.findByRole("button", { name: "Run" }));

    expect(runnerApi.runLesson).toHaveBeenCalledWith(
      "arrays",
      [{ id: "primary", content: "draft content" }],
      "1\n2\n",
    );
    expect(mutableWorkspace.files[0]?.draftContent).toBe("draft content");
    expect(mutableWorkspace.files[0]?.originalContent).toBe("original");
  });

  it("renders runtime error, timeout, and output limit states", async () => {
    const user = userEvent.setup();

    for (const [outcome, label] of [
      ["runtime_error", "Runtime error"],
      ["timeout", "Timed out"],
      ["output_limit", "Output limit exceeded"],
    ] as const) {
      cleanup();
      vi.mocked(runnerApi.runLesson).mockResolvedValue({
        compile: {
          outcome: "success",
          exitCode: 0,
          stdout: "",
          stderr: "",
          stdoutTruncated: false,
          stderrTruncated: false,
          diagnostics: [],
        },
        execution: {
          outcome,
          exitCode: outcome === "runtime_error" ? 1 : null,
          stdout: "",
          stderr: "",
          stdoutTruncated: false,
          stderrTruncated: false,
          durationMs: 3,
        },
      });

      renderPanel(<RunPanel lessonId="arrays" workspace={workspace} />);
      await user.click(await screen.findByRole("button", { name: "Run" }));
      expect(await screen.findByText(new RegExp(`Run: ${label}`))).toBeInTheDocument();
    }
  });

  it("guards duplicate run requests", async () => {
    const deferred: {
      resolve?: (value: Awaited<ReturnType<typeof runnerApi.runLesson>>) => void;
    } = {};
    vi.mocked(runnerApi.runLesson).mockImplementation(
      () =>
        new Promise((resolve) => {
          deferred.resolve = resolve;
        }),
    );

    const user = userEvent.setup();
    renderPanel(<RunPanel lessonId="arrays" workspace={workspace} />);

    const button = await screen.findByRole("button", { name: "Run" });
    await user.click(button);
    await user.click(button);

    deferred.resolve?.({
      compile: {
        outcome: "success",
        exitCode: 0,
        stdout: "",
        stderr: "",
        stdoutTruncated: false,
        stderrTruncated: false,
        diagnostics: [],
      },
      execution: {
        outcome: "success",
        exitCode: 0,
        stdout: "",
        stderr: "",
        stdoutTruncated: false,
        stderrTruncated: false,
        durationMs: 1,
      },
    });

    await waitFor(() => {
      expect(runnerApi.runLesson).toHaveBeenCalledTimes(1);
    });
  });

  it("still supports compile-only flow", async () => {
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
    renderPanel(<RunPanel lessonId="arrays" workspace={workspace} />);
    await user.click(await screen.findByRole("button", { name: "Compile" }));

    expect(await screen.findByText(/Compile: Build successful/)).toBeInTheDocument();
  });
});
