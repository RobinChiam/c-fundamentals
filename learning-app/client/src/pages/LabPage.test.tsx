import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as labsApi from "../api/labs-api";
import * as runnerApi from "../api/runner-api";
import { LabPage } from "./LabPage";
import { renderWithRouter } from "../test-utils";

vi.mock("../api/labs-api");
vi.mock("../api/runner-api");

const mockLabDetail = {
  id: "conditional-leap-year",
  lessonId: "conditional-statements",
  exerciseNumber: 1,
  title: "Leap Year Check",
  revision: 1,
  prompt: "Implement is_leap_year.",
  concepts: ["if / else"],
  starterFiles: [
    {
      id: "submission",
      name: "submission.c",
      language: "c" as const,
      content: "int is_leap_year(int year) { return 0; }",
    },
  ],
  publicTests: [
    { id: "leap-ordinary-leap", title: "Handles ordinary leap year", visibility: "public" as const },
  ],
  hiddenTests: [
    { id: "leap-century", title: "Handles century exception", visibility: "hidden" as const },
  ],
  revealedHints: [],
  solutionRevealed: false,
  status: "not_started" as const,
  progress: {
    hintsRevealed: 0,
    solutionRevealed: false,
    completedAt: null,
    lastAttemptAt: null,
  },
};

describe("LabPage", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.mocked(labsApi.getLab).mockResolvedValue(mockLabDetail);
    vi.mocked(labsApi.listLabDrafts).mockResolvedValue({
      labId: "conditional-leap-year",
      revision: 1,
      drafts: [],
    });
    vi.mocked(labsApi.listLabAttempts).mockResolvedValue({
      labId: "conditional-leap-year",
      attempts: [],
    });
    vi.mocked(runnerApi.getRunnerStatus).mockResolvedValue({
      available: true,
      runtime: "docker",
      image: "gcc:15.3.0-trixie",
      reason: null,
    });
  });

  it("renders lab route with starter code in Monaco", async () => {
    renderWithRouter(<LabPage />, {
      route: "/lessons/conditional-statements/labs/conditional-leap-year",
      path: "/lessons/:lessonId/labs/:labId",
    });

    expect(await screen.findByText("Leap Year Check")).toBeInTheDocument();
    expect(screen.getByLabelText("monaco-editor")).toHaveValue(
      "int is_leap_year(int year) { return 0; }",
    );
  });

  it("Run Tests sends current lab draft", async () => {
    const user = userEvent.setup();
    vi.mocked(labsApi.evaluateLab).mockResolvedValue({
      outcome: "failed",
      passedTests: 0,
      totalTests: 2,
      testResults: [
        {
          id: "leap-ordinary-leap",
          title: "Handles ordinary leap year",
          visibility: "public",
          passed: false,
        },
      ],
      compileDiagnostics: [],
      attemptPersisted: true,
    });

    renderWithRouter(<LabPage />, {
      route: "/lessons/conditional-statements/labs/conditional-leap-year",
      path: "/lessons/:lessonId/labs/:labId",
    });
    await screen.findByText("Leap Year Check");

    await user.click(screen.getByRole("button", { name: "Run Tests" }));

    await waitFor(() => {
      expect(labsApi.evaluateLab).toHaveBeenCalledWith(
        "conditional-leap-year",
        expect.objectContaining({
          files: [{ id: "submission", content: expect.any(String) }],
        }),
      );
    });
  });

  it("shows runner unavailable state", async () => {
    vi.mocked(runnerApi.getRunnerStatus).mockResolvedValue({
      available: false,
      runtime: "docker",
      image: "gcc:15.3.0-trixie",
      reason: "daemon_unavailable",
    });

    renderWithRouter(<LabPage />, {
      route: "/lessons/conditional-statements/labs/conditional-leap-year",
      path: "/lessons/:lessonId/labs/:labId",
    });

    expect(
      await screen.findByText(/Docker runner is unavailable/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run Tests" })).toBeDisabled();
  });

  it("shows solution confirmation before reveal", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LabPage />, {
      route: "/lessons/conditional-statements/labs/conditional-leap-year",
      path: "/lessons/:lessonId/labs/:labId",
    });
    await screen.findByText("Leap Year Check");

    await user.click(
      screen.getByRole("button", { name: "Reveal Reference Solution" }),
    );
    expect(
      screen.getByText(/may contain answers for more than this individual exercise/i),
    ).toBeInTheDocument();
  });
});
