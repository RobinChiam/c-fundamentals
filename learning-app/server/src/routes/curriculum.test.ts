import { afterAll, describe, expect, it } from "vitest";
import {
  curriculumResponseSchema,
  lessonDetailSchema,
  lessonFileContentSchema,
} from "@learning-app/shared";
import { buildApp } from "../app.js";
import { createCurriculumService } from "../curriculum/curriculum-service.js";
import { resolveDefaultRepositoryRoot } from "../curriculum/repository-root.js";

describe("curriculum routes", () => {
  const curriculumService = createCurriculumService({
    repositoryRoot: resolveDefaultRepositoryRoot(),
  });
  const appPromise = buildApp({ curriculumService });

  afterAll(async () => {
    const app = await appPromise;
    await app.close();
  });

  it("GET /api/curriculum returns 16 sequence-ordered summaries", async () => {
    const app = await appPromise;
    const response = await app.inject({
      method: "GET",
      url: "/api/curriculum",
    });

    expect(response.statusCode).toBe(200);
    const body = curriculumResponseSchema.parse(JSON.parse(response.body));
    expect(body.lessons).toHaveLength(16);
    expect(body.lessons.map((lesson) => lesson.sequence)).toEqual(
      Array.from({ length: 16 }, (_, index) => index),
    );
    expect(
      body.lessons.filter((lesson) => lesson.lessonNumber === 0),
    ).toHaveLength(2);
  });

  it("GET /api/lessons/arrays returns lesson metadata and descriptors", async () => {
    const app = await appPromise;
    const response = await app.inject({
      method: "GET",
      url: "/api/lessons/arrays",
    });

    expect(response.statusCode).toBe(200);
    const body = lessonDetailSchema.parse(JSON.parse(response.body));
    expect(body).toMatchObject({
      id: "arrays",
      lessonNumber: 6,
      title: "Arrays",
      difficulty: "Intermediate",
    });
    expect(body.files.map((file) => file.id)).toEqual([
      "readme",
      "primary",
      "solution",
    ]);
  });

  it("GET /api/lessons/header-files-and-multiple-source-files exposes multi-file structure", async () => {
    const app = await appPromise;
    const response = await app.inject({
      method: "GET",
      url: "/api/lessons/header-files-and-multiple-source-files",
    });

    expect(response.statusCode).toBe(200);
    const body = lessonDetailSchema.parse(JSON.parse(response.body));
    expect(body.files.map((file) => file.role)).toEqual([
      "readme",
      "primary",
      "support",
      "header",
      "solution",
    ]);
  });

  it("GET /api/lessons/intermediate-console-project exposes capstone files", async () => {
    const app = await appPromise;
    const response = await app.inject({
      method: "GET",
      url: "/api/lessons/intermediate-console-project",
    });

    expect(response.statusCode).toBe(200);
    const body = lessonDetailSchema.parse(JSON.parse(response.body));
    expect(body.files).toHaveLength(9);
    expect(new Set(body.files.map((file) => file.role))).toEqual(
      new Set(["readme", "primary", "support", "header", "solution"]),
    );
  });

  it("GET /api/lessons/arrays/files/primary returns repository content", async () => {
    const app = await appPromise;
    const response = await app.inject({
      method: "GET",
      url: "/api/lessons/arrays/files/primary",
    });

    expect(response.statusCode).toBe(200);
    const body = lessonFileContentSchema.parse(JSON.parse(response.body));
    expect(body.file.name).toBe("arrays.c");
    expect(body.content).toContain("Lesson 6 — Arrays");
  });

  it("GET /api/lessons/unknown returns 404", async () => {
    const app = await appPromise;
    const response = await app.inject({
      method: "GET",
      url: "/api/lessons/unknown",
    });

    expect(response.statusCode).toBe(404);
  });

  it("GET /api/lessons/arrays/files/unknown returns 404", async () => {
    const app = await appPromise;
    const response = await app.inject({
      method: "GET",
      url: "/api/lessons/arrays/files/unknown",
    });

    expect(response.statusCode).toBe(404);
  });

  it("GET /api/lessons/arrays/files/solution returns 403", async () => {
    const app = await appPromise;
    const response = await app.inject({
      method: "GET",
      url: "/api/lessons/arrays/files/solution",
    });

    expect(response.statusCode).toBe(403);
  });
});
