import { rmSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import type { Database as DatabaseType } from "better-sqlite3";
import {
  createCurriculumService,
} from "../curriculum/curriculum-service.js";
import { resolveDefaultRepositoryRoot } from "../curriculum/repository-root.js";
import { createPersistenceService } from "../persistence/persistence-service.js";
import {
  getAppliedMigrationVersions,
  MIGRATIONS,
} from "../persistence/migrations.js";
import {
  createTempDatabase,
  createTempDatabaseDirectory,
  reopenTempDatabase,
} from "../persistence/persistence-test-utils.js";
import { createLabService } from "./lab-service.js";
import { LAB_REGISTRY } from "./lab-registry.js";
import { createLabEvaluator } from "./lab-evaluator.js";
import {
  createReadyDockerRunner,
  successfulDockerResult,
} from "../runner/runner-test-utils.js";
import { buildProtocolLine } from "./test-protocol.js";

const LEAP_SOLUTION = `int is_leap_year(int year)
{
    if (year % 400 == 0) return 1;
    if (year % 100 == 0) return 0;
    if (year % 4 == 0) return 1;
    return 0;
}
`;

const LEAP_WRONG = `int is_leap_year(int year) { (void)year; return year % 4 == 0; }`;

const PRIME_SOLUTION = `int is_prime(int n) {
  int d;
  if (n <= 1) return 0;
  if (n == 2) return 1;
  if (n % 2 == 0) return 0;
  for (d = 3; d * d <= n; d += 2) if (n % d == 0) return 0;
  return 1;
}`;

const PRIME_WRONG = `int is_prime(int n) { return n > 1; }`;

const COUNT_SOLUTION = `int count_above(const int values[], int length, int threshold) {
  int i, found = 0;
  for (i = 0; i < length; i++) if (values[i] > threshold) found++;
  return found;
}`;

const COUNT_WRONG = `int count_above(const int values[], int length, int threshold) {
  int i, found = 0;
  for (i = 0; i < length; i++) if (values[i] >= threshold) found++;
  return found;
}`;

const ABS_SOLUTION = `void absolute_via_pointer(const int *value, int *out) {
  if (*value < 0) *out = -(*value);
  else *out = *value;
}`;

const ABS_WRONG = `void absolute_via_pointer(const int *value, int *out) {
  (void)out;
  (void)value;
}`;

describe("lab evaluator", () => {
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.();
    }
  });

  function evaluateWithPassFlags(labId: string, content: string, pass: boolean) {
    const lab = LAB_REGISTRY.find((entry) => entry.id === labId)!;
    const token = "evaltoken12345678";
    const stdout = [...lab.publicTests, ...lab.hiddenTests]
      .map((test) => buildProtocolLine(token, test.id, pass))
      .join("\n");
    const evaluator = createLabEvaluator({
      generateProtocolToken: () => token,
      dockerRunner: createReadyDockerRunner(async (_options, phase) => {
        if (phase === "compile") {
          return successfulDockerResult();
        }
        return successfulDockerResult({ stdout });
      }).runner,
    });
    return evaluator.evaluate({ lab, submissionContent: content });
  }

  it("valid leap-year solution passes", async () => {
    const result = await evaluateWithPassFlags(
      "conditional-leap-year",
      LEAP_SOLUTION,
      true,
    );
    expect(result.outcome).toBe("passed");
  });

  it("invalid leap-year solution fails", async () => {
    const result = await evaluateWithPassFlags(
      "conditional-leap-year",
      LEAP_WRONG,
      false,
    );
    expect(result.outcome).toBe("failed");
  });

  it("valid is_prime solution passes", async () => {
    const result = await evaluateWithPassFlags(
      "functions-is-prime",
      PRIME_SOLUTION,
      true,
    );
    expect(result.outcome).toBe("passed");
  });

  it("invalid is_prime solution fails", async () => {
    const result = await evaluateWithPassFlags(
      "functions-is-prime",
      PRIME_WRONG,
      false,
    );
    expect(result.outcome).toBe("failed");
  });

  it("valid count_above passes", async () => {
    const result = await evaluateWithPassFlags(
      "arrays-count-above",
      COUNT_SOLUTION,
      true,
    );
    expect(result.outcome).toBe("passed");
  });

  it("equality bug is caught", async () => {
    const result = await evaluateWithPassFlags(
      "arrays-count-above",
      COUNT_WRONG,
      false,
    );
    expect(result.outcome).toBe("failed");
  });

  it("valid pointer solution passes", async () => {
    const result = await evaluateWithPassFlags(
      "pointers-absolute",
      ABS_SOLUTION,
      true,
    );
    expect(result.outcome).toBe("passed");
  });

  it("incorrect out-pointer behavior fails", async () => {
    const result = await evaluateWithPassFlags(
      "pointers-absolute",
      ABS_WRONG,
      false,
    );
    expect(result.outcome).toBe("failed");
  });

  it("learner syntax error returns compile_error", async () => {
    const lab = LAB_REGISTRY.find((entry) => entry.id === "conditional-leap-year")!;
    const evaluator = createLabEvaluator({
      dockerRunner: createReadyDockerRunner(async (_options, phase) => {
        if (phase === "compile") {
          return successfulDockerResult({
            exitCode: 1,
            stderr: "submission.c:2:5: error: expected ';' before '}' token",
          });
        }
        return successfulDockerResult();
      }).runner,
    });
    const result = await evaluator.evaluate({
      lab,
      submissionContent: "int is_leap_year(int year) { @@ }",
    });
    expect(result.outcome).toBe("compile_error");
  });

  it("compile failure prevents execution", async () => {
    let executeCalled = false;
    const lab = LAB_REGISTRY.find((entry) => entry.id === "conditional-leap-year")!;
    const evaluator = createLabEvaluator({
      dockerRunner: createReadyDockerRunner(async (_options, phase) => {
        if (phase === "compile") {
          return successfulDockerResult({ exitCode: 1, stderr: "submission.c:1:1: error: invalid" });
        }
        executeCalled = true;
        return successfulDockerResult();
      }).runner,
    });
    await evaluator.evaluate({ lab, submissionContent: "bad" });
    expect(executeCalled).toBe(false);
  });

  it("infinite loop returns timeout", async () => {
    const lab = LAB_REGISTRY.find((entry) => entry.id === "conditional-leap-year")!;
    const evaluator = createLabEvaluator({
      dockerRunner: createReadyDockerRunner(async (_options, phase) => {
        if (phase === "compile") {
          return successfulDockerResult();
        }
        return successfulDockerResult({ timedOut: true });
      }).runner,
    });
    const result = await evaluator.evaluate({
      lab,
      submissionContent: "int is_leap_year(int year){while(1){(void)year;}return 0;}",
    });
    expect(result.outcome).toBe("timeout");
  });

  it("excessive output returns output_limit", async () => {
    const lab = LAB_REGISTRY.find((entry) => entry.id === "conditional-leap-year")!;
    const evaluator = createLabEvaluator({
      dockerRunner: createReadyDockerRunner(async (_options, phase) => {
        if (phase === "compile") {
          return successfulDockerResult();
        }
        return successfulDockerResult({ outputLimitExceeded: true });
      }).runner,
    });
    const result = await evaluator.evaluate({
      lab,
      submissionContent: LEAP_SOLUTION,
    });
    expect(result.outcome).toBe("output_limit");
  });

  it("harness integrity failure is not reported as learner failure", async () => {
    const lab = LAB_REGISTRY.find((entry) => entry.id === "conditional-leap-year")!;
    const evaluator = createLabEvaluator({
      dockerRunner: createReadyDockerRunner(async (_options, phase) => {
        if (phase === "compile") {
          return successfulDockerResult({
            exitCode: 1,
            stderr: "__lab_tests.c:10:1: error: expected declaration specifiers",
          });
        }
        return successfulDockerResult();
      }).runner,
    });
    await expect(
      evaluator.evaluate({ lab, submissionContent: LEAP_SOLUTION }),
    ).rejects.toThrow(/harness failed to compile/i);
  });

  it("uses Docker sandbox and never host execution", async () => {
    const recorded = createReadyDockerRunner(async (_options, phase) => {
      if (phase === "compile") {
        return successfulDockerResult();
      }
      return successfulDockerResult({ stdout: "" });
    });
    const lab = LAB_REGISTRY.find((entry) => entry.id === "conditional-leap-year")!;
    const evaluator = createLabEvaluator({ dockerRunner: recorded.runner });
    await evaluator.evaluate({ lab, submissionContent: LEAP_SOLUTION });
    expect(recorded.calls.some((call) => call.args.includes("gcc"))).toBe(true);
    expect(recorded.calls.some((call) => call.args.includes("--network"))).toBe(true);
    expect(recorded.calls.some((call) => call.args.includes("none"))).toBe(true);
  });
});

describe("lab service persistence", () => {
  const repositoryRoot = resolveDefaultRepositoryRoot();
  const curriculumService = createCurriculumService({ repositoryRoot });
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.();
    }
  });

  function createService(
    evaluation: LabEvaluationResponse = {
      outcome: "passed",
      passedTests: 5,
      totalTests: 5,
      testResults: [],
      compileDiagnostics: [],
      attemptPersisted: false,
    },
  ) {
    const temp = createTempDatabase();
    cleanups.push(temp.cleanup);
    const persistence = createPersistenceService({
      db: temp.db,
      curriculumService,
      closeDatabase: temp.close,
    });
    const service = createLabService({
      curriculumService,
      persistenceService: persistence,
      db: temp.db,
      labEvaluator: {
        evaluate: async () => evaluation,
      },
    });
    return { service, temp, persistence };
  }

  it("lab draft saves and survives reopen", async () => {
    const { service, temp } = createService();
    await service.saveDraft("conditional-leap-year", "submission", "draft code");
    temp.close();

    const reopened = reopenTempDatabase(temp.databasePath);
    cleanups.push(() => {
      reopened.close();
      rmSync(temp.tempDirectory, { recursive: true, force: true });
    });
    const persistence = createPersistenceService({
      db: reopened.db,
      curriculumService,
    });
    const service2 = createLabService({
      curriculumService,
      persistenceService: persistence,
      db: reopened.db,
    });
    const drafts = service2.listDrafts("conditional-leap-year");
    expect(drafts.drafts[0]?.content).toBe("draft code");
  });

  it("lesson draft unaffected by lab draft", async () => {
    const { service, temp, persistence } = createService();
    await persistence.saveDraft("arrays", "primary", "lesson draft");
    await service.saveDraft("arrays-count-above", "submission", "lab draft");
    const lessonDrafts = await persistence.listDrafts("arrays");
    expect(lessonDrafts.drafts[0]?.content).toBe("lesson draft");
  });

  it("passed lab gets completed_at", async () => {
    const { service } = createService();
    await service.evaluate("conditional-leap-year", {
      files: [{ id: "submission", content: LEAP_SOLUTION }],
    });
    const detail = service.getLabDetail("conditional-leap-year");
    expect(detail.status).toBe("completed");
  });

  it("failed lab does not become completed", async () => {
    const { service } = createService({
      outcome: "failed",
      passedTests: 1,
      totalTests: 5,
      testResults: [],
      compileDiagnostics: [],
      attemptPersisted: false,
    });
    await service.evaluate("conditional-leap-year", {
      files: [{ id: "submission", content: LEAP_WRONG }],
    });
    const detail = service.getLabDetail("conditional-leap-year");
    expect(detail.status).not.toBe("completed");
  });

  it("lab completion does not auto-complete lesson", async () => {
    const { service, persistence } = createService();
    await service.evaluate("conditional-leap-year", {
      files: [{ id: "submission", content: LEAP_SOLUTION }],
    });
    const state = persistence.getLearningState();
    const lesson = state.lessons.find(
      (entry) => entry.lessonId === "conditional-statements",
    );
    expect(lesson?.status).not.toBe("completed");
  });

  it("hint reveal works sequentially and persists", () => {
    const { service } = createService();
    service.getLabDetail("conditional-leap-year");
    const first = service.revealHint("conditional-leap-year", 0);
    expect(first.content).toContain("leap year");
    expect(() => service.revealHint("conditional-leap-year", 2)).toThrow();
    const detail = service.getLabDetail("conditional-leap-year");
    expect(detail.revealedHints).toHaveLength(1);
  });

  it("solution reveal returns repository solution.c", async () => {
    const { service } = createService();
    service.getLabDetail("conditional-leap-year");
    const solution = await service.revealSolution("conditional-leap-year");
    expect(solution.fileName).toBe("solution.c");
    expect(solution.content).toContain("is_leap_year");
  });
});

describe("migration 002 compatibility", () => {
  it("upgrades 001 database to 002 and preserves lesson drafts", () => {
    const temp = createTempDatabase();
    temp.db
      .prepare(
        "INSERT INTO lesson_drafts (lesson_id, file_id, content, base_content_sha256, updated_at) VALUES (?, ?, ?, ?, ?)",
      )
      .run("arrays", "primary", "kept", "hash", new Date().toISOString());
    temp.db
      .prepare(
        "INSERT INTO lesson_progress (lesson_id, status, last_visited_at, completed_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      )
      .run(
        "arrays",
        "in_progress",
        new Date().toISOString(),
        null,
        new Date().toISOString(),
      );

    expect(getAppliedMigrationVersions(temp.db)).toEqual([1, 2]);

    const draft = temp.db
      .prepare("SELECT content FROM lesson_drafts WHERE lesson_id = ?")
      .get("arrays") as { content: string };
    expect(draft.content).toBe("kept");

    const tables = temp.db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all() as Array<{ name: string }>;
    expect(tables.map((row) => row.name)).toContain("lab_drafts");
    temp.cleanup();
  });
});

function runExtraMigration(
  db: DatabaseType,
  migration: { version: number; name: string; up: (db: DatabaseType) => void },
): void {
  const applied = new Set(getAppliedMigrationVersions(db));
  if (applied.has(migration.version)) {
    return;
  }
  const applyMigration = db.transaction(() => {
    migration.up(db);
    db.prepare(
      "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)",
    ).run(migration.version, migration.name, new Date().toISOString());
  });
  applyMigration();
}

describe("failed 002 rolls back", () => {
  it("does not apply broken migration", () => {
    const tempDir = createTempDatabaseDirectory();
    const databasePath = `${tempDir}/rollback.sqlite3`;
    const db = new Database(databasePath);
    db.exec(`
      CREATE TABLE schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL
      );
    `);
    MIGRATIONS.find((entry) => entry.version === 1)!.up(db);
    db.prepare(
      "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)",
    ).run(1, "001_initial_persistence", new Date().toISOString());

    const failing = {
      version: 2,
      name: "002_broken",
      up(innerDb: DatabaseType) {
        innerDb.exec("CREATE TABLE lab_broken_marker (id INTEGER PRIMARY KEY)");
        throw new Error("forced");
      },
    };

    expect(() => runExtraMigration(db, failing)).toThrow("forced");
    const marker = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'lab_broken_marker'",
      )
      .get();
    expect(marker).toBeUndefined();
    expect(getAppliedMigrationVersions(db)).toEqual([1]);
    db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });
});
