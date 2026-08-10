import { mkdirSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { resolveDefaultDatabasePath } from "./database-path.js";
import {
  PersistenceInitializationError,
  UnsupportedMigrationVersionError,
} from "./persistence-errors.js";
import { KNOWN_MIGRATION_VERSION, runMigrations } from "./migrations.js";

export interface CreateDatabaseOptions {
  databasePath?: string;
}

export interface LearningDatabase {
  db: Database.Database;
  close(): void;
}

function configurePragmas(db: Database.Database): void {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
}

export function createDatabase(
  options: CreateDatabaseOptions = {},
): LearningDatabase {
  const databasePath = options.databasePath ?? resolveDefaultDatabasePath();

  try {
    mkdirSync(path.dirname(databasePath), { recursive: true });
  } catch (error) {
    throw new PersistenceInitializationError(
      "Unable to create database directory",
      { cause: error },
    );
  }

  let db: Database.Database;
  try {
    db = new Database(databasePath);
  } catch (error) {
    throw new PersistenceInitializationError("Unable to open database", {
      cause: error,
    });
  }

  try {
    configurePragmas(db);
    runMigrations(db);
  } catch (error) {
    db.close();
    if (
      error instanceof Error &&
      error.message.includes("Unsupported migration version")
    ) {
      throw new UnsupportedMigrationVersionError(
        parseUnsupportedVersion(error.message),
        KNOWN_MIGRATION_VERSION,
      );
    }
    throw new PersistenceInitializationError("Migration failed", { cause: error });
  }

  return {
    db,
    close() {
      db.close();
    },
  };
}

function parseUnsupportedVersion(message: string): number {
  const match = message.match(/Unsupported migration version (\d+)/);
  return match ? Number.parseInt(match[1]!, 10) : Number.MAX_SAFE_INTEGER;
}

export function getJournalMode(db: Database.Database): string {
  const row = db.pragma("journal_mode", { simple: true }) as string;
  return row.toLowerCase();
}
