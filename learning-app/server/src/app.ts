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
import { createDatabase } from "./persistence/database.js";
import { resolveDefaultDatabasePath } from "./persistence/database-path.js";
import { PersistenceInitializationError, UnsupportedMigrationVersionError } from "./persistence/persistence-errors.js";
import {
  createPersistenceService,
  createUnavailablePersistenceService,
  type PersistenceService,
} from "./persistence/persistence-service.js";
import { registerCompilerRoutes } from "./routes/compiler.js";
import { registerCurriculumRoutes } from "./routes/curriculum.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerPersistenceRoutes } from "./routes/persistence.js";
import { registerRunnerRoutes } from "./routes/runner.js";
import {
  createRunnerService,
  type RunnerService,
} from "./runner/runner-service.js";

export interface BuildAppOptions {
  curriculumService?: CurriculumService;
  compilerService?: CompilerService;
  runnerService?: RunnerService;
  persistenceService?: PersistenceService;
  repositoryRoot?: string;
  databasePath?: string;
  skipPersistence?: boolean;
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

  let persistenceService = options.persistenceService;
  let ownedPersistence: PersistenceService | undefined;

  if (!persistenceService && !options.skipPersistence) {
    try {
      const database = createDatabase({
        databasePath: options.databasePath ?? resolveDefaultDatabasePath(),
      });
      ownedPersistence = createPersistenceService({
        db: database.db,
        curriculumService,
        closeDatabase: () => database.close(),
      });
      persistenceService = ownedPersistence;
    } catch (error) {
      if (
        !(error instanceof PersistenceInitializationError) &&
        !(error instanceof UnsupportedMigrationVersionError)
      ) {
        throw error;
      }
      ownedPersistence = createUnavailablePersistenceService();
      persistenceService = ownedPersistence;
    }
  }

  if (!persistenceService) {
    persistenceService = createUnavailablePersistenceService();
  }

  app.addHook("onClose", async () => {
    persistenceService?.close();
  });

  await registerHealthRoutes(app);
  await registerCurriculumRoutes(app, curriculumService);
  await registerCompilerRoutes(app, compilerService);
  await registerRunnerRoutes(app, runnerService);
  await registerPersistenceRoutes(app, persistenceService);

  return app;
}
