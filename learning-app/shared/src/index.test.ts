import { describe, expect, it } from "vitest";
import {
  createHealthResponse,
  HEALTH_SERVICE_NAME,
  healthResponseSchema,
} from "./index.js";

describe("health contract", () => {
  it("defines the expected service name", () => {
    expect(HEALTH_SERVICE_NAME).toBe("c-fundamentals-learning-app");
  });

  it("validates the health response shape", () => {
    const response = createHealthResponse();
    expect(healthResponseSchema.parse(response)).toEqual({
      status: "ok",
      service: "c-fundamentals-learning-app",
    });
  });
});
