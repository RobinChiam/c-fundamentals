import Fastify, { type FastifyInstance } from "fastify";
import {
  createCurriculumService,
  type CurriculumService,
} from "./curriculum/curriculum-service.js";
import { resolveDefaultRepositoryRoot } from "./curriculum/repository-root.js";
import { registerCurriculumRoutes } from "./routes/curriculum.js";
import { registerHealthRoutes } from "./routes/health.js";

export interface BuildAppOptions {
  curriculumService?: CurriculumService;
  repositoryRoot?: string;
}

export async function buildApp(
  options: BuildAppOptions = {},
): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  const curriculumService =
    options.curriculumService ??
    createCurriculumService({
      repositoryRoot: options.repositoryRoot ?? resolveDefaultRepositoryRoot(),
    });

  await registerHealthRoutes(app);
  await registerCurriculumRoutes(app, curriculumService);

  return app;
}
