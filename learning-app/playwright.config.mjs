import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const learningAppRoot = path.dirname(fileURLToPath(import.meta.url));
const e2eDataDir = path.join(learningAppRoot, ".e2e-data");
const e2eDatabasePath = path.join(e2eDataDir, "learning-lab.sqlite3");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: `mkdir -p ${JSON.stringify(e2eDataDir)} && pnpm build && NODE_ENV=production LEARNING_APP_PORT=4173 LEARNING_APP_DATABASE_PATH=${JSON.stringify(e2eDatabasePath)} pnpm --filter @learning-app/server start`,
    cwd: learningAppRoot,
    url: "http://127.0.0.1:4173/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  outputDir: path.join(learningAppRoot, "test-results"),
});
