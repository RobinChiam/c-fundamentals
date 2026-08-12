import Fastify, { type FastifyInstance } from "fastify";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createCompilerService,
  type CompilerService,
} from "./compiler/compiler-service.js";
import { createTrackedProcessRunner } from "./compiler/tracked-process-runner.js";
import {
  createCurriculumService,
  type CurriculumService,
} from "./curriculum/curriculum-service.js";
import { CURRICULUM_MANIFEST } from "./curriculum/manifest.js";
import { resolveDefaultRepositoryRoot } from "./curriculum/repository-root.js";
import { createDatabase } from "./persistence/database.js";
import { resolveDefaultDatabasePath } from "./persistence/database-path.js";
import {
  PersistenceInitializationError,
  UnsupportedMigrationVersionError,
} from "./persistence/persistence-errors.js";
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
import {
  DEFAULT_CONCURRENCY_CONFIG,
  type ConcurrencyConfig,
} from "./config/concurrency-config.js";
import { resolveHttpConfig } from "./config/http-config.js";
import {
  createExecutionGate,
  type ExecutionGate,
} from "./concurrency/execution-gate.js";
import { registerProductionErrorHandler } from "./errors/register-production-error-handler.js";
import { registerSecurityHeaders } from "./security/security-headers.js";
import { registerStaticServing } from "./static/static-serving.js";
import {
  cleanupOwnedDockerContainers,
  createShutdownManager,
  type ShutdownManager,
} from "./shutdown/graceful-shutdown.js";

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
  serveStatic?: boolean;
  clientDistPath?: string;
  enableSecurityHeaders?: boolean;
  concurrencyConfig?: ConcurrencyConfig;
  compilerGate?: ExecutionGate;
  sandboxGate?: ExecutionGate;
  shutdownManager?: ShutdownManager;
  registerSignalHandlers?: boolean;
}

function resolveDefaultClientDistPath(): string {
  const serverDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(serverDir, "../../client/dist");
}

export async function buildApp(
  options: BuildAppOptions = {},
): Promise<FastifyInstance> {
  const httpConfig = resolveHttpConfig();
  const app = Fastify({
    logger: false,
    bodyLimit: httpConfig.bodyLimitBytes,
    requestTimeout: httpConfig.requestTimeoutMs,
  });

  const concurrencyConfig =
    options.concurrencyConfig ?? DEFAULT_CONCURRENCY_CONFIG;
  const compilerGate =
    options.compilerGate ?? createExecutionGate(concurrencyConfig.compilerCapacity);
  const sandboxGate =
    options.sandboxGate ?? createExecutionGate(concurrencyConfig.sandboxCapacity);

  const trackedProcessRunner = createTrackedProcessRunner();
  const shutdownManager =
    options.shutdownManager ??
    createShutdownManager({
      cleanupOwnedDockerContainers,
      terminateOwnedCompilerProcesses: () =>
        trackedProcessRunner.terminateActiveProcesses(),
    });

  shutdownManager.registerShutdownHandler(async () => {
    await app.close();
  });

  const curriculumService =
    options.curriculumService ??
    createCurriculumService({
      repositoryRoot: options.repositoryRoot ?? resolveDefaultRepositoryRoot(),
    });
  const compilerService =
    options.compilerService ??
    createCompilerService({ processRunner: trackedProcessRunner });
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

  if (options.enableSecurityHeaders ?? false) {
    registerProductionErrorHandler(app);
    await registerSecurityHeaders(app);
  }

  await registerHealthRoutes(app);
  await registerCurriculumRoutes(app, curriculumService);
  await registerCompilerRoutes(app, compilerService, {
    compilerGate,
    shutdownManager,
  });
  await registerRunnerRoutes(app, runnerService, {
    sandboxGate,
    shutdownManager,
  });
  await registerPersistenceRoutes(app, persistenceService);
  await registerLabRoutes(app, labService, {
    sandboxGate,
    shutdownManager,
  });
  await registerArchitectureRoutes(app, architectureService);

  if (options.serveStatic) {
    await registerStaticServing(app, {
      clientDistPath:
        options.clientDistPath ?? resolveDefaultClientDistPath(),
    });
  }

  app.decorate("shutdownManager", shutdownManager);

  return app;
}

declare module "fastify" {
  interface FastifyInstance {
    shutdownManager: ShutdownManager;
  }
}
