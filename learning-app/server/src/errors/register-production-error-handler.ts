import type { FastifyError, FastifyInstance } from "fastify";
import {
  sanitizeClientErrorMessage,
  sanitizeProductionError,
} from "./sanitize-error.js";

export function registerProductionErrorHandler(
  app: FastifyInstance,
): void {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    const statusCode =
      typeof error.statusCode === "number" &&
      error.statusCode >= 400 &&
      error.statusCode < 600
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      request.log.error(error);
      return reply.status(statusCode).send({ error: "Internal server error" });
    }

    const message = sanitizeProductionError(error);
    return reply.status(statusCode).send({
      error: message === "Internal server error"
        ? sanitizeClientErrorMessage(
            error instanceof Error ? error.message : "Bad request",
          ) || "Bad request"
        : message,
    });
  });
}
