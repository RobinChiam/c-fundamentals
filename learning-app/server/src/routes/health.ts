import type { FastifyInstance } from "fastify";
import {
  createHealthResponse,
  healthResponseSchema,
} from "@learning-app/shared";

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/health", async () => {
    const response = createHealthResponse();
    return healthResponseSchema.parse(response);
  });
}
