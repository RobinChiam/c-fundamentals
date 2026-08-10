import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  draftListResponseSchema,
  learningStateSchema,
  lessonProgressSchema,
  persistenceStatusSchema,
  savedDraftSchema,
} from "@learning-app/shared";
import { buildApp } from "../app.js";
import {
  createCurriculumService,
} from "../curriculum/curriculum-service.js";
import { resolveDefaultRepositoryRoot } from "../curriculum/repository-root.js";
import { createDatabase } from "../persistence/database.js";
import {
  createPersistenceService,
  createUnavailablePersistenceService,
} from "../persistence/persistence-service.js";

describe("persistence routes", () => {
  const repositoryRoot = resolveDefaultRepositoryRoot();
  const curriculumService = createCurriculumService({ repositoryRoot });
  const tempDirectories: string[] = [];

  afterEach(() => {
    for (const directory of tempDirectories.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  function createTestApp() {
    const tempDirectory = mkdtempSync(path.join(os.tmpdir(), "learning-lab-route-"));
    tempDirectories.push(tempDirectory);
    const databasePath = path.join(tempDirectory, "test.sqlite3");
    const database = createDatabase({ databasePath });
    const persistenceService = createPersistenceService({
      db: database.db,
      curriculumService,
      closeDatabase: () => database.close(),
    });
    return buildApp({ curriculumService, persistenceService });
  }

  it("persistence status available", async () => {
    const app = await createTestApp();
    const response = await app.inject({ method: "GET", url: "/api/persistence/status" });
    const body = persistenceStatusSchema.parse(JSON.parse(response.body));
    expect(body.available).toBe(true);
    await app.close();
  });

  it("persistence unavailable/degraded result", async () => {
    const app = await buildApp({
      curriculumService,
      persistenceService: createUnavailablePersistenceService(),
    });
    const response = await app.inject({ method: "GET", url: "/api/persistence/status" });
    const body = persistenceStatusSchema.parse(JSON.parse(response.body));
    expect(body).toEqual({
      available: false,
      database: "sqlite",
      reason: "initialization_failed",
    });
    await app.close();
  });

  it("learning-state response validates shared schema", async () => {
    const app = await createTestApp();
    await app.inject({ method: "POST", url: "/api/lessons/arrays/visit" });
    const response = await app.inject({ method: "GET", url: "/api/learning-state" });
    const body = learningStateSchema.parse(JSON.parse(response.body));
    expect(body.lastLessonId).toBe("arrays");
    await app.close();
  });

  it("visit route works", async () => {
    const app = await createTestApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/lessons/arrays/visit",
    });
    const body = lessonProgressSchema.parse(JSON.parse(response.body));
    expect(body.status).toBe("in_progress");
    await app.close();
  });

  it("progress update works", async () => {
    const app = await createTestApp();
    const response = await app.inject({
      method: "PUT",
      url: "/api/lessons/arrays/progress",
      payload: { status: "completed" },
    });
    const body = lessonProgressSchema.parse(JSON.parse(response.body));
    expect(body.status).toBe("completed");
    await app.close();
  });

  it("draft list works", async () => {
    const app = await createTestApp();
    await app.inject({
      method: "PUT",
      url: "/api/lessons/arrays/drafts/primary",
      payload: { content: "draft" },
    });
    const response = await app.inject({
      method: "GET",
      url: "/api/lessons/arrays/drafts",
    });
    const body = draftListResponseSchema.parse(JSON.parse(response.body));
    expect(body.drafts[0]?.content).toBe("draft");
    await app.close();
  });

  it("draft save works", async () => {
    const app = await createTestApp();
    const response = await app.inject({
      method: "PUT",
      url: "/api/lessons/arrays/drafts/primary",
      payload: { content: "saved draft" },
    });
    const body = savedDraftSchema.parse(JSON.parse(response.body));
    expect(body.content).toBe("saved draft");
    await app.close();
  });

  it("one-draft delete works", async () => {
    const app = await createTestApp();
    await app.inject({
      method: "PUT",
      url: "/api/lessons/arrays/drafts/primary",
      payload: { content: "draft" },
    });
    const response = await app.inject({
      method: "DELETE",
      url: "/api/lessons/arrays/drafts/primary",
    });
    expect(response.statusCode).toBe(204);
    await app.close();
  });

  it("all-drafts delete works", async () => {
    const app = await createTestApp();
    await app.inject({
      method: "PUT",
      url: "/api/lessons/arrays/drafts/primary",
      payload: { content: "draft" },
    });
    const response = await app.inject({
      method: "DELETE",
      url: "/api/lessons/arrays/drafts",
    });
    expect(response.statusCode).toBe(204);
    await app.close();
  });

  it("persistence errors do not expose database path", async () => {
    const app = await buildApp({
      curriculumService,
      persistenceService: createUnavailablePersistenceService(),
    });
    const response = await app.inject({ method: "GET", url: "/api/learning-state" });
    expect(response.statusCode).toBe(503);
    expect(response.body).not.toMatch(/\.sqlite3/i);
    expect(response.body).not.toMatch(/learning-lab/i);
    await app.close();
  });

  it("rejects solution draft persistence", async () => {
    const app = await createTestApp();
    const response = await app.inject({
      method: "PUT",
      url: "/api/lessons/arrays/drafts/solution",
      payload: { content: "secret" },
    });
    expect(response.statusCode).toBe(400);
    await app.close();
  });
});
