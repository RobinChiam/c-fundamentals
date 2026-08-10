import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as curriculumApi from "../api/curriculum-api";
import { CurriculumPage } from "./CurriculumPage";
import { mockCurriculumResponse } from "../test-fixtures/curriculum";
import { renderWithRouter } from "../test-utils";

vi.mock("../api/curriculum-api");
vi.mock("../api/persistence-api", () => ({
  getLearningState: vi.fn().mockResolvedValue({
    lastLessonId: null,
    lessons: [],
  }),
}));

describe("CurriculumPage", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders all supplied curriculum entries in sequence order", async () => {
    vi.mocked(curriculumApi.listCurriculum).mockResolvedValue({
      lessons: [...mockCurriculumResponse.lessons].reverse(),
    });

    renderWithRouter(<CurriculumPage />);

    expect(screen.getByText("Loading curriculum…")).toBeInTheDocument();

    const cards = await screen.findAllByRole("article");
    const lessonTitles = cards.map(
      (card) => within(card).getByRole("heading", { level: 2 }).textContent,
    );

    expect(lessonTitles).toEqual([
      "Basic IO",
      "Drawing Shapes",
      "Variables and Data Types",
      "Arrays",
      "Header Files and Multiple Source Files",
      "Intermediate Console Project",
    ]);
  });

  it("supports two separate Lesson 0 entries", async () => {
    vi.mocked(curriculumApi.listCurriculum).mockResolvedValue(mockCurriculumResponse);

    renderWithRouter(<CurriculumPage />);

    const lessonZeroLabels = await screen.findAllByText((_, element) => {
      return element?.textContent === "Lesson 0";
    });
    expect(lessonZeroLabels).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Basic IO" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Drawing Shapes" }),
    ).toBeInTheDocument();
  });

  it("links lessons using stable lesson IDs", async () => {
    vi.mocked(curriculumApi.listCurriculum).mockResolvedValue(mockCurriculumResponse);

    renderWithRouter(<CurriculumPage />);

    const arraysLink = await screen.findByRole("link", { name: "Arrays" });
    expect(arraysLink).toHaveAttribute("href", "/lessons/arrays");
  });

  it("shows a loading state", () => {
    vi.mocked(curriculumApi.listCurriculum).mockReturnValue(new Promise(() => undefined));

    renderWithRouter(<CurriculumPage />);

    expect(screen.getByText("Loading curriculum…")).toBeInTheDocument();
  });

  it("shows a failure state with retry", async () => {
    const user = userEvent.setup();
    vi.mocked(curriculumApi.listCurriculum)
      .mockRejectedValueOnce(new curriculumApi.CurriculumApiError("boom"))
      .mockResolvedValueOnce(mockCurriculumResponse);

    renderWithRouter(<CurriculumPage />);

    expect(
      await screen.findByText("Unable to load curriculum"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByRole("heading", { name: "Arrays" })).toBeInTheDocument();
  });
});
