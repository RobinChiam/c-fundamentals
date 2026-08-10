import type Database from "better-sqlite3";

export interface AppStateRow {
  id: number;
  last_lesson_id: string | null;
  updated_at: string;
}

export interface AppStateRepository {
  get(): AppStateRow | undefined;
  setLastLessonId(lastLessonId: string, updatedAt: string): void;
}

export function createAppStateRepository(
  db: Database.Database,
): AppStateRepository {
  const getStmt = db.prepare(`
    SELECT id, last_lesson_id, updated_at
    FROM app_state
    WHERE id = 1
  `);

  const upsertStmt = db.prepare(`
    INSERT INTO app_state (id, last_lesson_id, updated_at)
    VALUES (1, ?, ?)
    ON CONFLICT (id) DO UPDATE SET
      last_lesson_id = excluded.last_lesson_id,
      updated_at = excluded.updated_at
  `);

  return {
    get(): AppStateRow | undefined {
      return getStmt.get() as AppStateRow | undefined;
    },

    setLastLessonId(lastLessonId: string, updatedAt: string): void {
      upsertStmt.run(lastLessonId, updatedAt);
    },
  };
}
