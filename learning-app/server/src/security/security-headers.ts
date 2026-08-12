import type { FastifyInstance } from "fastify";
import helmet from "@fastify/helmet";

export async function registerSecurityHeaders(
  app: FastifyInstance,
): Promise<void> {
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'none'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        connectSrc: ["'self'"],
        // Monaco workers and blob URLs for editor functionality.
        workerSrc: ["'self'", "blob:"],
        // Monaco inline styles and bundled CSS.
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'", "data:"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: false,
  });
}
