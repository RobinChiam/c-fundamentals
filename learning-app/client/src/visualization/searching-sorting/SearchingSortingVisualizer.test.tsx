import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SearchingSortingVisualizerPage } from "../../pages/SearchingSortingVisualizerPage";
import { SearchingSortingVisualizer } from "./SearchingSortingVisualizer";

function renderVisualizer(route = "/lessons/searching-and-sorting/visualize") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route
          path="/lessons/searching-and-sorting/visualize"
          element={<SearchingSortingVisualizerPage />}
        />
        <Route path="/lessons/searching-and-sorting" element={<div>Lesson page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderComponent() {
  return render(
    <MemoryRouter>
      <SearchingSortingVisualizer />
    </MemoryRouter>,
  );
}

describe("SearchingSortingVisualizer UI", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("reduce"),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("visualizer route renders", () => {
    renderVisualizer();
    expect(
      screen.getByRole("heading", { name: /Searching and Sorting — Visualizer/i }),
    ).toBeInTheDocument();
  });

  it("shows conceptual-not-debugger notice", () => {
    renderComponent();
    expect(
      screen.getByText(/does not trace your edited C program/i),
    ).toBeInTheDocument();
  });

  it("allows selecting four algorithms", () => {
    renderComponent();
    expect(screen.getByLabelText("Linear Search")).toBeInTheDocument();
    expect(screen.getByLabelText("Binary Search")).toBeInTheDocument();
    expect(screen.getByLabelText("Bubble Sort")).toBeInTheDocument();
    expect(screen.getByLabelText("Insertion Sort")).toBeInTheDocument();
  });

  it("shows target only for search algorithms", async () => {
    const user = userEvent.setup();
    renderComponent();

    expect(screen.getByLabelText("Target")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Bubble Sort"));
    expect(screen.queryByLabelText("Target")).not.toBeInTheDocument();
  });

  it("shows sort order only for sort algorithms", async () => {
    const user = userEvent.setup();
    renderComponent();

    expect(screen.queryByText("Sort order")).not.toBeInTheDocument();
    await user.click(screen.getByLabelText("Bubble Sort"));
    expect(screen.getByText("Sort order")).toBeInTheDocument();
  });

  it("shows binary unsorted warning and does not run checks", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByLabelText("Binary Search"));
    const arrayInput = screen.getByLabelText(/Array values/i);
    await user.clear(arrayInput);
    await user.type(arrayInput, "42, 7, 19, 3");

    expect(screen.getByRole("alert")).toHaveTextContent(/ascending sorted input/i);
    expect(screen.getByText(/Precondition failed/i)).toBeInTheDocument();
    expect(screen.queryByText(/Mid/i)).not.toBeInTheDocument();
  });

  it("updates narration and metrics with steps", async () => {
    const user = userEvent.setup();
    renderComponent();

    expect(screen.getByText(/Check index 0/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText(/Check index 1/i)).toBeInTheDocument();
    expect(screen.getByText("Comparisons")).toBeInTheDocument();
  });

  it("shows step count", () => {
    renderComponent();
    expect(screen.getByText(/Step 1 of/i)).toBeInTheDocument();
  });

  it("exposes keyboard-accessible native controls", () => {
    renderComponent();
    for (const name of ["Reset", "Previous", "Play", "Next", "End"]) {
      expect(screen.getByRole("button", { name })).toBeEnabled();
    }
  });

  it("uses text labels beyond color alone", () => {
    renderComponent();
    expect(screen.getByText(/Legend/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Index 0, value 42, Current/i)).toBeInTheDocument();
  });

  it("remains usable with reduced motion preference", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("reduce"),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );

    renderComponent();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    expect(screen.getByLabelText("Array visualization")).toBeInTheDocument();
  });

  it("resets playback when algorithm changes", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText(/Step 2 of/i)).toBeInTheDocument();

    await user.click(screen.getByLabelText("Binary Search"));
    expect(screen.getByText(/Step 1 of/i)).toBeInTheDocument();
  });

  it("resets playback when input changes", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole("button", { name: "Next" }));
    const arrayInput = screen.getByLabelText(/Array values/i);
    await user.type(arrayInput, "0");

    expect(screen.getByText(/Step 1 of/i)).toBeInTheDocument();
  });

  it("resets playback when target changes", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole("button", { name: "Next" }));
    const targetInput = screen.getByLabelText("Target");
    await user.clear(targetInput);
    await user.type(targetInput, "7");

    expect(screen.getByText(/Step 1 of/i)).toBeInTheDocument();
  });

  it("resets playback when sort order changes", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByLabelText("Bubble Sort"));
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByLabelText("descending"));

    expect(screen.getByText(/Step 1 of/i)).toBeInTheDocument();
  });

  it("links back to lesson material", () => {
    renderComponent();
    expect(screen.getByRole("link", { name: /Return to lesson material/i })).toHaveAttribute(
      "href",
      "/lessons/searching-and-sorting",
    );
  });

  it("rejects invalid array input clearly", async () => {
    const user = userEvent.setup();
    renderComponent();
    const arrayInput = screen.getByLabelText(/Array values/i);
    await user.clear(arrayInput);
    await user.type(arrayInput, "1,,2");
    expect(screen.getByText(/Empty values are not allowed/i)).toBeInTheDocument();
  });

  it("finds curriculum default target at index 2", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText(/Found the target/i)).toBeInTheDocument();
  });

  it("runs sort algorithms even when target input is invalid", async () => {
    const user = userEvent.setup();
    renderComponent();

    const targetInput = screen.getByLabelText("Target");
    await user.clear(targetInput);
    await user.type(targetInput, "abc");

    await user.click(screen.getByLabelText("Bubble Sort"));

    expect(screen.getByLabelText(/Index 0, value 42/i)).toBeInTheDocument();
    expect(screen.queryByText(/Target must be an integer/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Step 1 of/i)).toBeInTheDocument();
    expect(screen.getByText(/greater than|already in order/i)).toBeInTheDocument();
  });

  it("does not require compiler, runner, or persistence APIs", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderComponent();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("SearchingSortingVisualizer playback controls", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("supports manual stepping controls", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText(/Check index 1/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByText(/Check index 0/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByText(/Step 1 of/i)).toBeInTheDocument();
  });
});
