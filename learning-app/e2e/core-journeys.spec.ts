import { expect, test } from "@playwright/test";

const E2E_DRAFT_MARKER = "// e2e-persistence-marker";

async function waitForCodeWorkspace(page: import("@playwright/test").Page) {
  await expect(page.getByRole("region", { name: /code workspace/i })).toBeVisible({
    timeout: 15_000,
  });
}

test.describe("core journeys", () => {
  test("dashboard renders curriculum", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Curriculum" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Variables and Data Types", exact: true }),
    ).toBeVisible();
  });

  test("navigates to lesson and renders workspace", async ({ page }) => {
    await page.goto("/lessons/variables-and-data-types");
    await expect(
      page.getByRole("heading", { level: 1, name: "Variables and Data Types" }),
    ).toBeVisible();
    await expect(page.getByRole("region", { name: /code workspace/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("lab page opens from lesson", async ({ page }) => {
    await page.goto("/lessons/conditional-statements/labs/conditional-leap-year");
    await expect(
      page.getByRole("heading", { level: 1, name: /leap year check/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /run tests/i })).toBeVisible();
  });

  test("visualizer route loads", async ({ page }) => {
    await page.goto("/lessons/searching-and-sorting/visualize");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /searching and sorting — visualizer/i,
      }),
    ).toBeVisible();
  });

  test("architecture explorer loads for capstone lesson", async ({ page }) => {
    await page.goto("/lessons/intermediate-console-project/architecture");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Intermediate Console Project",
      }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("tab", { name: /overview/i })).toBeVisible({
      timeout: 30_000,
    });
  });

  test("unknown route shows not found", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    await expect(page.getByRole("heading", { name: /page not found/i })).toBeVisible();
  });

  test("production deep-link refresh works", async ({ page }) => {
    await page.goto("/lessons/pointers/visualize");
    await expect(
      page.getByRole("heading", { level: 1, name: /pointers — visualizer/i }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("heading", { level: 1, name: /pointers — visualizer/i }),
    ).toBeVisible();
  });
});

test.describe("learning journeys", () => {
  test.describe.configure({ mode: "serial" });

  test("persists lesson draft across reload", async ({ page, request }) => {
    const lessonResponse = await request.get("/api/lessons/variables-and-data-types");
    const lesson = await lessonResponse.json();
    const primaryFile = lesson.files.find(
      (file: { role: string }) => file.role === "primary",
    );
    expect(primaryFile).toBeTruthy();

    const draftContent = `${E2E_DRAFT_MARKER}\nint main(void) { return 0; }\n`;
    const saveResponse = await request.put(
      `/api/lessons/variables-and-data-types/drafts/${primaryFile.id}`,
      { data: { content: draftContent } },
    );
    expect(saveResponse.ok()).toBeTruthy();

    await page.goto("/lessons/variables-and-data-types");
    await waitForCodeWorkspace(page);
    await expect(page.getByText("1 modified file")).toBeVisible({ timeout: 15_000 });

    await page.reload();
    await waitForCodeWorkspace(page);
    await expect(page.getByText("1 modified file")).toBeVisible({ timeout: 15_000 });

    const draftsResponse = await request.get(
      "/api/lessons/variables-and-data-types/drafts",
    );
    const drafts = await draftsResponse.json();
    expect(
      drafts.drafts.some((draft: { content: string }) =>
        draft.content.includes(E2E_DRAFT_MARKER),
      ),
    ).toBeTruthy();
  });

  test("marks lesson progress and shows Continue Learning", async ({ page, request }) => {
    await request.put("/api/lessons/operators-and-expressions/progress", {
      data: { status: "in_progress" },
    });
    const visitResponse = await request.post(
      "/api/lessons/operators-and-expressions/visit",
    );
    expect(visitResponse.ok()).toBeTruthy();

    await page.goto("/lessons/operators-and-expressions");
    await expect(
      page.getByRole("heading", { level: 1, name: "Operators and Expressions" }),
    ).toBeVisible();
    const completeButton = page.getByRole("button", { name: /mark lesson complete/i });
    await expect(completeButton).toBeVisible({ timeout: 15_000 });
    await completeButton.click();
    await expect(page.getByText("Completed")).toBeVisible();

    await page.goto("/");
    await expect
      .poll(async () => {
        const stateResponse = await request.get("/api/learning-state");
        const state = await stateResponse.json();
        return state.lastLessonId;
      })
      .toBe("operators-and-expressions");
    await expect(
      page.getByRole("link", {
        name: /Continue Learning: Operators and Expressions/i,
      }),
    ).toBeVisible();
  });

  test("reveals lab hint", async ({ page }) => {
    await page.goto("/lessons/conditional-statements/labs/conditional-leap-year");
    await expect(
      page.getByRole("button", { name: /reveal next hint/i }),
    ).toBeVisible();
    await page.getByRole("button", { name: /reveal next hint/i }).click();
    await expect(page.locator("section, article").getByRole("listitem").first()).toBeVisible();
  });

  test("solution reveal confirmation dialog focuses and restores focus", async ({
    page,
  }) => {
    await page.goto("/lessons/conditional-statements/labs/conditional-leap-year");
    const revealButton = page.getByRole("button", {
      name: /reveal reference solution/i,
    });
    await revealButton.click();

    const confirmButton = page.getByRole("button", { name: /confirm reveal/i });
    await expect(confirmButton).toBeVisible();
    await expect(confirmButton).toBeFocused();

    await page.getByRole("button", { name: /^cancel$/i }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(revealButton).toBeFocused();
  });

  test("Part 10 control-flow visualizer loads", async ({ page }) => {
    await page.goto("/lessons/loops-and-input-validation/visualize");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /loops and input validation — visualizer/i,
      }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /play/i })).toBeVisible();
  });
});

test.describe("accessibility", () => {
  test("skip link and main landmark exist", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#main-content")).toBeVisible();
    await page.getByRole("link", { name: /skip to main content/i }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });

  test("major pages remain usable at 200% zoom", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    await expect(page.getByRole("heading", { level: 1, name: "Curriculum" })).toBeVisible();
    await expect(page.getByRole("link", { name: /skip to main content/i })).toBeVisible();

    await page.goto("/lessons/variables-and-data-types");
    await expect(
      page.getByRole("heading", { level: 1, name: "Variables and Data Types" }),
    ).toBeVisible();
    await expect(page.getByRole("region", { name: /code workspace/i })).toBeVisible({
      timeout: 15_000,
    });
  });
});

test.describe("keyboard navigation", () => {
  test("can navigate curriculum with keyboard", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Curriculum" })).toBeVisible();

    const firstLesson = page.getByRole("link", {
      name: "Basic IO",
      exact: true,
    });
    await firstLesson.focus();
    await expect(firstLesson).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/lessons\/basic-io\/?$/);
  });
});
