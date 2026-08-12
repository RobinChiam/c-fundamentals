import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import { createExecutionGate } from "./concurrency/execution-gate.js";
import { createShutdownManager } from "./shutdown/graceful-shutdown.js";

describe("production server", () => {
  const apps: Array<Awaited<ReturnType<typeof buildApp>>> = [];

  afterEach(async () => {
    await Promise.all(apps.map((app) => app.close()));
    apps.length = 0;
  });

  async function createProductionApp(clientDistPath: string) {
    const app = await buildApp({
      serveStatic: true,
      clientDistPath,
      enableSecurityHeaders: true,
      skipPersistence: true,
      skipArchitectureValidation: true,
      registerSignalHandlers: false,
    });
    apps.push(app);
    return app;
  }

  it("serves index.html at root and preserves API routes", async () => {
    const dist = await mkdtemp(path.join(os.tmpdir(), "learning-lab-dist-"));
    await writeFile(
      path.join(dist, "index.html"),
      "<!doctype html><html><body>Learning Lab</body></html>",
      "utf8",
    );
    await mkdir(path.join(dist, "assets"), { recursive: true });
    await writeFile(
      path.join(dist, "assets", "app.js"),
      "console.log('ok');",
      "utf8",
    );

    const app = await createProductionApp(dist);

    const root = await app.inject({ method: "GET", url: "/" });
    expect(root.statusCode).toBe(200);
    expect(root.body).toContain("Learning Lab");
    expect(root.headers["cache-control"]).toBeDefined();
    expect(root.headers["cache-control"]).not.toContain("immutable");

    const health = await app.inject({ method: "GET", url: "/api/health" });
    expect(health.statusCode).toBe(200);

    const apiMissing = await app.inject({
      method: "GET",
      url: "/api/does-not-exist",
    });
    expect(apiMissing.statusCode).toBe(404);
    expect(apiMissing.headers["content-type"]).toContain("application/json");

    const deepRoute = await app.inject({
      method: "GET",
      url: "/lessons/variables-and-data-types",
    });
    expect(deepRoute.statusCode).toBe(200);
    expect(deepRoute.body).toContain("Learning Lab");

    const missingAsset = await app.inject({
      method: "GET",
      url: "/assets/missing.js",
    });
    expect(missingAsset.statusCode).toBe(404);
  });

  it("adds security headers in production mode", async () => {
    const dist = await mkdtemp(path.join(os.tmpdir(), "learning-lab-dist-"));
    await writeFile(path.join(dist, "index.html"), "<html></html>", "utf8");

    const app = await createProductionApp(dist);
    const response = await app.inject({ method: "GET", url: "/" });

    expect(response.headers["content-security-policy"]).toContain("default-src 'self'");
    expect(response.headers["x-frame-options"]).toBeDefined();
    expect(response.headers["strict-transport-security"]).toBeUndefined();
  });

  it("returns 429 when compiler capacity is exhausted", async () => {
    const gate = createExecutionGate(1);
    expect(gate.tryAcquire()).toBe(true);

    const app = await buildApp({
      compilerGate: gate,
      skipPersistence: true,
      skipArchitectureValidation: true,
    });
    apps.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/api/lessons/variables-and-data-types/compile",
      payload: { files: [] },
    });

    expect(response.statusCode).toBe(429);
    gate.release();
  });

  it("closes cleanly through shutdown manager", async () => {
    const shutdownManager = createShutdownManager();
    const app = await buildApp({
      shutdownManager,
      skipPersistence: true,
      skipArchitectureValidation: true,
    });
    apps.pop();
    apps.push(app);

    await shutdownManager.runShutdown();
    expect(shutdownManager.isShuttingDown()).toBe(true);
  });

  it("sanitizes uncaught production errors", async () => {
    const dist = await mkdtemp(path.join(os.tmpdir(), "learning-lab-dist-"));
    await writeFile(path.join(dist, "index.html"), "<html></html>", "utf8");

    const app = await buildApp({
      serveStatic: true,
      clientDistPath: dist,
      enableSecurityHeaders: true,
      skipPersistence: true,
      skipArchitectureValidation: true,
    });
    apps.push(app);

    app.get("/api/review-error", async () => {
      throw new Error(
        "failed at /home/learner/projects/c-fundamentals/secret/path",
      );
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/review-error",
    });

    expect(response.statusCode).toBe(500);
    expect(response.body).not.toContain("/home/learner");
    expect(response.body).not.toContain("secret/path");
    expect(response.body).not.toContain("stack");
    expect(response.json()).toEqual({ error: "Internal server error" });
  });
});
