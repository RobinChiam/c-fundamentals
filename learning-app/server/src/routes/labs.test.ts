import { afterAll, describe, expect, it } from "vitest";
import {
  labDetailSchema,
  labEvaluationResponseSchema,
} from "@learning-app/shared";
import { buildApp } from "../app.js";
import { createCurriculumService } from "../curriculum/curriculum-service.js";
import { resolveDefaultRepositoryRoot } from "../curriculum/repository-root.js";
import { createPersistenceService } from "../persistence/persistence-service.js";
import { createLabService } from "../labs/lab-service.js";
import { createTempDatabase } from "../persistence/persistence-test-utils.js";
import { LAB_REGISTRY } from "../labs/lab-registry.js";

describe("lab routes privacy", () => {
  const repositoryRoot = resolveDefaultRepositoryRoot();
  const curriculumService = createCurriculumService({ repositoryRoot });
  const temp = createTempDatabase();
  const persistence = createPersistenceService({
    db: temp.db,
    curriculumService,
    closeDatabase: temp.close,
  });
  const labService = createLabService({
    curriculumService,
    persistenceService: persistence,
    db: temp.db,
  });
  const appPromise = buildApp({
    curriculumService,
    persistenceService: persistence,
    labService,
    databasePath: temp.databasePath,
  });

  afterAll(async () => {
    const app = await appPromise;
    await app.close();
    temp.cleanup();
  });

  it("lesson lab summaries contain no harness source", async () => {
    const app = await appPromise;
    const response = await app.inject({
      method: "GET",
      url: "/api/lessons/conditional-statements/labs",
    });
    const body = JSON.parse(response.body) as { labs: unknown[] };
    expect(JSON.stringify(body)).not.toContain("__lab_tests.c");
    expect(JSON.stringify(body)).not.toContain("emit_result");
  });

  it("LabDetail contains no private harness or unrevealed hints", async () => {
    const app = await appPromise;
    const response = await app.inject({
      method: "GET",
      url: "/api/labs/conditional-leap-year",
    });
    const body = labDetailSchema.parse(JSON.parse(response.body));
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain("__lab_tests.c");
    expect(serialized).not.toContain("emit_result");
    expect(serialized).not.toContain("1900");
    expect(body.revealedHints).toHaveLength(0);
    expect(serialized).not.toContain("solution.c");
  });

  it("generic solution endpoint rejects direct read", async () => {
    const app = await appPromise;
    const response = await app.inject({
      method: "GET",
      url: "/api/lessons/conditional-statements/files/solution",
    });
    expect(response.statusCode).toBe(403);
  });

  it("evaluation response contains safe metadata only", async () => {
    const app = await appPromise;
    const response = await app.inject({
      method: "POST",
      url: "/api/labs/conditional-leap-year/evaluate",
      payload: {
        files: [{ id: "submission", content: "int is_leap_year(int y){return 0;}" }],
      },
    });
    if (response.statusCode === 503) {
      expect(response.body).toContain("Runner unavailable");
      return;
    }
    const body = labEvaluationResponseSchema.parse(JSON.parse(response.body));
    expect(JSON.stringify(body)).not.toContain("__lab_tests.c");
    expect(body.testResults.every((test) => test.title.length > 0)).toBe(true);
  });

  it("lists four lesson labs on mapped lessons", async () => {
    const app = await appPromise;
    for (const lab of LAB_REGISTRY) {
      const response = await app.inject({
        method: "GET",
        url: `/api/lessons/${lab.lessonId}/labs`,
      });
      const body = JSON.parse(response.body) as { labs: Array<{ id: string }> };
      expect(body.labs.some((entry) => entry.id === lab.id)).toBe(true);
    }
  });
});
