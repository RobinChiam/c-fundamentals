import Fastify, { type FastifyInstance } from "fastify";
import {
  createCompilerService,
  type CompilerService,
} from "./compiler/compiler-service.js";
import {
  createCurriculumService,
  type CurriculumService,
} from "./curriculum/curriculum-service.js";
import { resolveDefaultRepositoryRoot } from "./curriculum/repository-root.js";
import { registerCompilerRoutes } from "./routes/compiler.js";
import { registerCurriculumRoutes } from "./routes/curriculum.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerRunnerRoutes } from "./routes/runner.js";
import {
  createRunnerService,
  type RunnerService,
} from "./runner/runner-service.js";

export interface BuildAppOptions {
  curriculumService?: CurriculumService;
  compilerService?: CompilerService;
  runnerService?: RunnerService;
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
  const compilerService =
    options.compilerService ?? createCompilerService();
  const runnerService =
    options.runnerService ?? createRunnerService();

  await registerHealthRoutes(app);
  await registerCurriculumRoutes(app, curriculumService);
  await registerCompilerRoutes(app, compilerService);
  await registerRunnerRoutes(app, runnerService);

  return app;
}
