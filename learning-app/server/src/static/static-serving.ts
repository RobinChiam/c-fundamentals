import path from "node:path";
import type { FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";

export interface StaticServingOptions {
  clientDistPath: string;
}

export async function registerStaticServing(
  app: FastifyInstance,
  options: StaticServingOptions,
): Promise<void> {
  const root = path.resolve(options.clientDistPath);
  const assetsRoot = path.join(root, "assets");

  await app.register(fastifyStatic, {
    root: assetsRoot,
    prefix: "/assets/",
    decorateReply: true,
    wildcard: true,
    list: false,
    setHeaders(response, filePath) {
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        response.header(
          "Cache-Control",
          "public, max-age=31536000, immutable",
        );
      }
    },
  });

  app.get("/", async (_request, reply) => {
    reply.header("Cache-Control", "no-cache");
    return reply.sendFile("index.html", root);
  });

  app.get("/*", async (request, reply) => {
    if (request.url.startsWith("/api/")) {
      return reply.status(404).send({ error: "Not found" });
    }

    const extension = path.extname(request.url);
    if (extension.length > 0) {
      return reply.status(404).send({ error: "Not found" });
    }

    reply.header("Cache-Control", "no-cache");
    return reply.sendFile("index.html", root);
  });
}
