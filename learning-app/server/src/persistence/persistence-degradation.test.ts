import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import {
  createCurriculumService,
} from "../curriculum/curriculum-service.js";
import { resolveDefaultRepositoryRoot } from "../curriculum/repository-root.js";

describe("persistence degradation", () => {
  const tempDirectories: string[] = [];

  afterEach(() => {
    for (const directory of tempDirectories.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("curriculum remains available when persistence init fails", async () => {
    const tempDirectory = mkdtempSync(path.join(os.tmpdir(), "learning-lab-bad-"));
    tempDirectories.push(tempDirectory);
    const databasePath = path.join(tempDirectory, "not-a-directory.sqlite3");
    // Create a file where the directory should be to force init failure.
    const { writeFileSync } = await import("node:fs");
    writeFileSync(databasePath, "block");

    const app = await buildApp({
      curriculumService: createCurriculumService({
        repositoryRoot: resolveDefaultRepositoryRoot(),
      }),
      databasePath: path.join(databasePath, "nested/test.sqlite3"),
    });

    const curriculum = await app.inject({ method: "GET", url: "/api/curriculum" });
    expect(curriculum.statusCode).toBe(200);

    const compiler = await app.inject({ method: "GET", url: "/api/compiler/status" });
    expect(compiler.statusCode).toBe(200);

    const runner = await app.inject({ method: "GET", url: "/api/runner/status" });
    expect(runner.statusCode).toBe(200);

    const persistence = await app.inject({
      method: "GET",
      url: "/api/persistence/status",
    });
    expect(persistence.statusCode).toBe(200);
    expect(JSON.parse(persistence.body).available).toBe(false);

    await app.close();
  });
});
