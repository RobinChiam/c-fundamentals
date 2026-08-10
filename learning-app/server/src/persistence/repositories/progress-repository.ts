import type Database from "better-sqlite3";

export interface ProgressRow {
  lesson_id: string;
  status: "in_progress" | "completed";
  last_visited_at: string;
  completed_at: string | null;
  updated_at: string;
}

export interface ProgressRepository {
  findAll(): ProgressRow[];
  findOne(lessonId: string): ProgressRow | undefined;
  upsertVisit(
    lessonId: string,
    lastVisitedAt: string,
    updatedAt: string,
  ): ProgressRow;
  updateStatus(
    lessonId: string,
    status: "in_progress" | "completed",
    lastVisitedAt: string,
    completedAt: string | null,
    updatedAt: string,
  ): ProgressRow;
}

export function createProgressRepository(
  db: Database.Database,
): ProgressRepository {
  const findAllStmt = db.prepare(`
    SELECT lesson_id, status, last_visited_at, completed_at, updated_at
    FROM lesson_progress
    ORDER BY lesson_id ASC
  `);

  const findOneStmt = db.prepare(`
    SELECT lesson_id, status, last_visited_at, completed_at, updated_at
    FROM lesson_progress
    WHERE lesson_id = ?
  `);

  const insertProgressStmt = db.prepare(`
    INSERT INTO lesson_progress (
      lesson_id, status, last_visited_at, completed_at, updated_at
    ) VALUES (?, 'in_progress', ?, NULL, ?)
  `);

  const updateVisitStmt = db.prepare(`
    UPDATE lesson_progress
    SET last_visited_at = ?, updated_at = ?
    WHERE lesson_id = ?
  `);

  const updateStatusStmt = db.prepare(`
    UPDATE lesson_progress
    SET status = ?, last_visited_at = ?, completed_at = ?, updated_at = ?
    WHERE lesson_id = ?
  `);

  return {
    findAll(): ProgressRow[] {
      return findAllStmt.all() as ProgressRow[];
    },

    findOne(lessonId: string): ProgressRow | undefined {
      return findOneStmt.get(lessonId) as ProgressRow | undefined;
    },

    upsertVisit(
      lessonId: string,
      lastVisitedAt: string,
      updatedAt: string,
    ): ProgressRow {
      const existing = findOneStmt.get(lessonId) as ProgressRow | undefined;
      if (!existing) {
        insertProgressStmt.run(lessonId, lastVisitedAt, updatedAt);
      } else {
        updateVisitStmt.run(lastVisitedAt, updatedAt, lessonId);
      }

      return findOneStmt.get(lessonId) as ProgressRow;
    },

    updateStatus(
      lessonId: string,
      status: "in_progress" | "completed",
      lastVisitedAt: string,
      completedAt: string | null,
      updatedAt: string,
    ): ProgressRow {
      const existing = findOneStmt.get(lessonId) as ProgressRow | undefined;
      if (!existing) {
        insertProgressStmt.run(lessonId, lastVisitedAt, updatedAt);
      }

      updateStatusStmt.run(
        status,
        lastVisitedAt,
        completedAt,
        updatedAt,
        lessonId,
      );

      return findOneStmt.get(lessonId) as ProgressRow;
    },
  };
}
