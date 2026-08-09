import { z } from "zod";

export const HEALTH_SERVICE_NAME = "c-fundamentals-learning-app" as const;

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.literal(HEALTH_SERVICE_NAME),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export function createHealthResponse(): HealthResponse {
  return {
    status: "ok",
    service: HEALTH_SERVICE_NAME,
  };
}
