import { describe, expect, it, afterAll } from "vitest";
import { healthResponseSchema } from "@learning-app/shared";
import { buildApp } from "./app.js";

describe("GET /api/health", () => {
  const appPromise = buildApp();

  afterAll(async () => {
    const app = await appPromise;
    await app.close();
  });

  it("returns HTTP 200", async () => {
    const app = await appPromise;
    const response = await app.inject({
      method: "GET",
      url: "/api/health",
    });

    expect(response.statusCode).toBe(200);
  });

  it("returns the defined health contract", async () => {
    const app = await appPromise;
    const response = await app.inject({
      method: "GET",
      url: "/api/health",
    });

    const body = healthResponseSchema.parse(JSON.parse(response.body));
    expect(body).toEqual({
      status: "ok",
      service: "c-fundamentals-learning-app",
    });
  });
});
