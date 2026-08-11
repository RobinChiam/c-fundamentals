import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ControlFlowVisualizerPage } from "../../pages/ControlFlowVisualizerPage";
import { DynamicMemoryVisualizerPage } from "../../pages/DynamicMemoryVisualizerPage";
import { FunctionCallVisualizerPage } from "../../pages/FunctionCallVisualizerPage";
import { PointerVisualizerPage } from "../../pages/PointerVisualizerPage";
import { ControlFlowVisualizer } from "../control-flow/ControlFlowVisualizer";
import { DynamicMemoryVisualizer } from "../dynamic-memory/DynamicMemoryVisualizer";
import { FunctionCallVisualizer } from "../functions/FunctionCallVisualizer";
import { PointerVisualizer } from "../pointers/PointerVisualizer";

function stubReducedMotion() {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("reduce"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

const visualizers = [
  {
    name: "FunctionCallVisualizer",
    Component: FunctionCallVisualizer,
    page: FunctionCallVisualizerPage,
    route: "/lessons/functions-and-scope/visualize",
    scenarioRadio: "Pass by value",
    conceptualText: /conceptual teaching model/i,
    simulatedText: null,
    firstNarration: /original is 100/i,
    secondScenario: "Recursive factorial",
  },
  {
    name: "PointerVisualizer",
    Component: PointerVisualizer,
    page: PointerVisualizerPage,
    route: "/lessons/pointers/visualize",
    scenarioRadio: "Address and dereference",
    conceptualText: /conceptual teaching model/i,
    simulatedText: /simulated addresses/i,
    firstNarration: /x = 5/i,
    secondScenario: "Swap via pointers",
  },
  {
    name: "DynamicMemoryVisualizer",
    Component: DynamicMemoryVisualizer,
    page: DynamicMemoryVisualizerPage,
    route: "/lessons/dynamic-memory-allocation/visualize",
    scenarioRadio: "malloc / initialize / free",
    conceptualText: /conceptual teaching model/i,
    simulatedText: /simulated addresses/i,
    firstNarration: /Live allocation #1 with 4 int slots/i,
    secondScenario: "calloc (zero-initialized)",
  },
  {
    name: "ControlFlowVisualizer",
    Component: ControlFlowVisualizer,
    page: ControlFlowVisualizerPage,
    route: "/lessons/loops-and-input-validation/visualize",
    scenarioRadio: "for loop",
    conceptualText: /conceptual teaching model/i,
    simulatedText: null,
    firstNarration: /initialization/i,
    secondScenario: "Sentinel while loop",
  },
] as const;

describe.each(visualizers)("Part 10 playback reuse — $name", ({
  Component,
  firstNarration,
  secondScenario,
}) => {
  beforeEach(() => stubReducedMotion());
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  function renderComponent() {
    return render(
      <MemoryRouter>
        <Component />
      </MemoryRouter>,
    );
  }

  it("uses existing playback controls", () => {
    renderComponent();
    for (const name of ["Reset", "Previous", "Play", "Next", "End"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    expect(screen.getByLabelText("Playback speed")).toBeInTheDocument();
  });

  it("Previous and Next work", async () => {
    const user = userEvent.setup();
    renderComponent();
    expect(screen.getByText(firstNarration)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText(/Step 2 of/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByText(/Step 1 of/i)).toBeInTheDocument();
  });

  it("Reset works", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByText(/Step 1 of/i)).toBeInTheDocument();
  });

  it("Play and Pause work", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByRole("button", { name: "Play" }));
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Pause" }));
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });

  it("speed control is available", () => {
    renderComponent();
    expect(screen.getByLabelText("Playback speed")).toBeInTheDocument();
  });

  it("scenario change resets playback", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText(/Step 2 of/i)).toBeInTheDocument();
    await user.click(screen.getByLabelText(secondScenario));
    expect(screen.getByText(/Step 1 of/i)).toBeInTheDocument();
  });
});

describe.each(visualizers)("Part 10 UI — $name", ({
  Component,
  page: Page,
  route,
  scenarioRadio,
  conceptualText,
  simulatedText,
}) => {
  beforeEach(() => stubReducedMotion());
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("route renders", () => {
    render(
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={route} element={<Page />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it("shows conceptual model notice", () => {
    render(
      <MemoryRouter>
        <Component />
      </MemoryRouter>,
    );
    expect(screen.getByText(conceptualText)).toBeInTheDocument();
  });

  it("shows simulated address notice where relevant", () => {
    render(
      <MemoryRouter>
        <Component />
      </MemoryRouter>,
    );
    if (simulatedText) {
      expect(screen.getByText(simulatedText)).toBeInTheDocument();
    }
  });

  it("scenarios selectable and narration rendered", () => {
    render(
      <MemoryRouter>
        <Component />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText(scenarioRadio)).toBeInTheDocument();
    expect(screen.getByText(/Narration/i)).toBeInTheDocument();
  });

  it("keyboard controls usable", () => {
    render(
      <MemoryRouter>
        <Component />
      </MemoryRouter>,
    );
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("no compiler/runner/persistence API required", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(
      <MemoryRouter>
        <Component />
      </MemoryRouter>,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("FunctionCallVisualizer specifics", () => {
  beforeEach(() => stubReducedMotion());
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows conceptual call frames label", () => {
    render(
      <MemoryRouter>
        <FunctionCallVisualizer />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Conceptual call frames/i)).toBeInTheDocument();
  });
});

describe("PointerVisualizer specifics", () => {
  beforeEach(() => stubReducedMotion());
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("pointer alias has textual equivalent", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <PointerVisualizer />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getAllByText(/p points to x/i).length).toBeGreaterThan(0);
  });

  it("NULL dereference shows UB in UI", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <PointerVisualizer />
      </MemoryRouter>,
    );
    await user.click(screen.getByLabelText("NULL pointer safety"));
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getAllByText(/Undefined behavior/i).length).toBeGreaterThan(0);
  });
});

describe("DynamicMemoryVisualizer specifics", () => {
  beforeEach(() => stubReducedMotion());
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("malloc shows uninitialized slots", () => {
    render(
      <MemoryRouter>
        <DynamicMemoryVisualizer />
      </MemoryRouter>,
    );
    expect(screen.getAllByText("?").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/uninitialized/i).length).toBeGreaterThan(0);
  });

  it("calloc shows zeros", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <DynamicMemoryVisualizer />
      </MemoryRouter>,
    );
    await user.click(screen.getByLabelText("calloc (zero-initialized)"));
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });
});

describe("ControlFlowVisualizer specifics", () => {
  beforeEach(() => stubReducedMotion());
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("flow has textual active node equivalent", () => {
    render(
      <MemoryRouter>
        <ControlFlowVisualizer />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Active node:/i)).toBeInTheDocument();
  });

  it("sentinel scenario shows count and sum", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ControlFlowVisualizer />
      </MemoryRouter>,
    );
    await user.click(screen.getByLabelText("Sentinel while loop"));
    await user.click(screen.getByRole("button", { name: "End" }));
    expect(screen.getByText("count")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
  });
});
