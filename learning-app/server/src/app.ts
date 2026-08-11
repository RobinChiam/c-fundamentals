import Fastify, { type FastifyInstance } from "fastify";
import {
  createCompilerService,
  type CompilerService,
} from "./compiler/compiler-service.js";
import {
  createCurriculumService,
  type CurriculumService,
} from "./curriculum/curriculum-service.js";
import { CURRICULUM_MANIFEST } from "./curriculum/manifest.js";
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
import { registerArchitectureRoutes } from "./routes/architecture.js";
import {
  createArchitectureService,
  type ArchitectureService,
} from "./architecture/architecture-service.js";
import { validateArchitectureDefinitions } from "./architecture/architecture-integrity.js";
import {
  createRunnerService,
  type RunnerService,
} from "./runner/runner-service.js";
import { createLabService, type LabService } from "./labs/lab-service.js";
import { registerLabRoutes } from "./routes/labs.js";
import { validateLabRegistry } from "./labs/validate-lab-registry.js";

export interface BuildAppOptions {
  curriculumService?: CurriculumService;
  compilerService?: CompilerService;
  runnerService?: RunnerService;
  persistenceService?: PersistenceService;
  labService?: LabService;
  architectureService?: ArchitectureService;
  repositoryRoot?: string;
  databasePath?: string;
  skipPersistence?: boolean;
  skipArchitectureValidation?: boolean;
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
  let ownedDatabase: ReturnType<typeof createDatabase> | undefined;

  if (!persistenceService && !options.skipPersistence) {
    try {
      const database = createDatabase({
        databasePath: options.databasePath ?? resolveDefaultDatabasePath(),
      });
      ownedDatabase = database;
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

  validateLabRegistry();

  if (!options.skipArchitectureValidation) {
    await validateArchitectureDefinitions(
      CURRICULUM_MANIFEST,
      undefined,
      curriculumService,
    );
  }

  const architectureService =
    options.architectureService ??
    createArchitectureService({ curriculumService });

  const labService =
    options.labService ??
    createLabService({
      curriculumService,
      persistenceService,
      db: ownedDatabase?.db,
    });

  app.addHook("onClose", async () => {
    persistenceService?.close();
  });

  await registerHealthRoutes(app);
  await registerCurriculumRoutes(app, curriculumService);
  await registerCompilerRoutes(app, compilerService);
  await registerRunnerRoutes(app, runnerService);
  await registerPersistenceRoutes(app, persistenceService);
  await registerLabRoutes(app, labService);
  await registerArchitectureRoutes(app, architectureService);

  return app;
}
