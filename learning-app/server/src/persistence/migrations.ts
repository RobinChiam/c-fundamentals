import type Database from "better-sqlite3";

export interface Migration {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: "001_initial_persistence",
    up(db) {
      db.exec(`
        CREATE TABLE app_state (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          last_lesson_id TEXT,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE lesson_progress (
          lesson_id TEXT PRIMARY KEY,
          status TEXT NOT NULL CHECK (
            status IN ('in_progress', 'completed')
          ),
          last_visited_at TEXT NOT NULL,
          completed_at TEXT,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE lesson_drafts (
          lesson_id TEXT NOT NULL,
          file_id TEXT NOT NULL,
          content TEXT NOT NULL,
          base_content_sha256 TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          PRIMARY KEY (lesson_id, file_id)
        );
      `);
    },
  },
];

export const KNOWN_MIGRATION_VERSION = Math.max(
  0,
  ...MIGRATIONS.map((migration) => migration.version),
);

export function ensureSchemaMigrationsTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);
}

export function getAppliedMigrationVersions(db: Database.Database): number[] {
  ensureSchemaMigrationsTable(db);
  const rows = db
    .prepare("SELECT version FROM schema_migrations ORDER BY version ASC")
    .all() as Array<{ version: number }>;
  return rows.map((row) => row.version);
}

export function getMaxAppliedMigrationVersion(db: Database.Database): number {
  const versions = getAppliedMigrationVersions(db);
  return versions.length === 0 ? 0 : Math.max(...versions);
}

export function runMigrations(db: Database.Database): void {
  ensureSchemaMigrationsTable(db);

  const maxApplied = getMaxAppliedMigrationVersion(db);
  if (maxApplied > KNOWN_MIGRATION_VERSION) {
    throw new Error(
      `Unsupported migration version ${maxApplied} > ${KNOWN_MIGRATION_VERSION}`,
    );
  }

  const applied = new Set(getAppliedMigrationVersions(db));
  const ordered = [...MIGRATIONS].sort((left, right) => left.version - right.version);

  for (const migration of ordered) {
    if (applied.has(migration.version)) {
      continue;
    }

    const applyMigration = db.transaction(() => {
      migration.up(db);
      db.prepare(
        "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)",
      ).run(migration.version, migration.name, new Date().toISOString());
    });

    applyMigration();
  }
}
