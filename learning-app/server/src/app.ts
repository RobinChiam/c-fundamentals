import Fastify, { type FastifyInstance } from "fastify";
import {
  createHealthResponse,
  healthResponseSchema,
} from "@learning-app/shared";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  app.get("/api/health", async () => {
    const response = createHealthResponse();
    return healthResponseSchema.parse(response);
  });

  return app;
}
