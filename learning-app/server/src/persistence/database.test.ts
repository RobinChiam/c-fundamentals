import { existsSync, rmSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import type Database from "better-sqlite3";
import { createDatabase, getJournalMode } from "./database.js";
import {
  getAppliedMigrationVersions,
} from "./migrations.js";
import {
  createTempDatabase,
  createTempDatabaseDirectory,
  reopenTempDatabase,
} from "./persistence-test-utils.js";

describe("database and migrations", () => {
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.();
    }
  });

  it("first startup creates DB", () => {
    const temp = createTempDatabase();
    cleanups.push(temp.cleanup);
    expect(existsSync(temp.databasePath)).toBe(true);
  });

  it("initial migration creates expected tables", () => {
    const temp = createTempDatabase();
    cleanups.push(temp.cleanup);

    const tables = temp.db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name ASC",
      )
      .all() as Array<{ name: string }>;

    expect(tables.map((row) => row.name)).toEqual([
      "app_state",
      "lesson_drafts",
      "lesson_progress",
      "schema_migrations",
    ]);
  });

  it("migration recorded exactly once", () => {
    const temp = createTempDatabase();
    cleanups.push(temp.cleanup);

    const rows = temp.db
      .prepare("SELECT version, name FROM schema_migrations")
      .all() as Array<{ version: number; name: string }>;

    expect(rows).toEqual([
      { version: 1, name: "001_initial_persistence" },
    ]);
  });

  it("second startup does not reapply migration", () => {
    const temp = createTempDatabase();
    const databasePath = temp.databasePath;
    temp.close();

    const reopened = reopenTempDatabase(databasePath);
    cleanups.push(() => {
      reopened.close();
      rmSync(temp.tempDirectory, { recursive: true, force: true });
    });

    const versions = getAppliedMigrationVersions(reopened.db);
    expect(versions).toEqual([1]);
  });

  it("unsupported future migration version handled safely", () => {
    const temp = createTempDatabase();
    cleanups.push(temp.cleanup);

    temp.db
      .prepare(
        "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)",
      )
      .run(99, "099_future", new Date().toISOString());

    expect(() => reopenTempDatabase(temp.databasePath)).toThrow(
      /newer than application supports/i,
    );
  });

  it("WAL configured", () => {
    const temp = createTempDatabase();
    cleanups.push(temp.cleanup);
    expect(getJournalMode(temp.db)).toBe("wal");
  });

  it("injected database path works", () => {
    const tempDir = createTempDatabaseDirectory();
    const databasePath = `${tempDir}/injected.sqlite3`;
    const database = createDatabase({ databasePath });
    cleanups.push(() => {
      database.close();
      rmSync(tempDir, { recursive: true, force: true });
    });

    expect(database.db.prepare("SELECT 1 AS ok").get()).toEqual({ ok: 1 });
  });

  it("database close/reopen works", () => {
    const temp = createTempDatabase();
    const databasePath = temp.databasePath;
    temp.db
      .prepare(
        "INSERT INTO lesson_drafts (lesson_id, file_id, content, base_content_sha256, updated_at) VALUES (?, ?, ?, ?, ?)",
      )
      .run("arrays", "primary", "draft", "hash", new Date().toISOString());
    temp.close();

    const reopened = reopenTempDatabase(databasePath);
    cleanups.push(() => {
      reopened.close();
      rmSync(temp.tempDirectory, { recursive: true, force: true });
    });

    const row = reopened.db
      .prepare("SELECT content FROM lesson_drafts WHERE lesson_id = ? AND file_id = ?")
      .get("arrays", "primary") as { content: string };
    expect(row.content).toBe("draft");
  });
});

describe("migration rollback", () => {
  it("migration transaction rolls back on failure", () => {
    const temp = createTempDatabase();
    const failingMigration = {
      version: 2,
      name: "002_should_fail",
      up(db: Database.Database) {
        db.exec("CREATE TABLE migration_fail_marker (id INTEGER PRIMARY KEY)");
        throw new Error("forced migration failure");
      },
    };

    expect(() => {
      runExtraMigration(temp.db, failingMigration);
    }).toThrow("forced migration failure");

    const markerExists = temp.db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'migration_fail_marker'",
      )
      .get();
    expect(markerExists).toBeUndefined();
    expect(getAppliedMigrationVersions(temp.db)).toEqual([1]);
    temp.cleanup();
  });
});

function runExtraMigration(
  db: Database.Database,
  migration: { version: number; name: string; up: (db: Database.Database) => void },
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
