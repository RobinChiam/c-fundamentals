import type Database from "better-sqlite3";
import type { LabAttemptOutcome } from "@learning-app/shared";

export interface LabAttemptRow {
  id: number;
  lab_id: string;
  outcome: LabAttemptOutcome;
  passed_tests: number;
  total_tests: number;
  created_at: string;
}

export interface LabAttemptRepository {
  insert(
    labId: string,
    outcome: LabAttemptOutcome,
    passedTests: number,
    totalTests: number,
    createdAt: string,
  ): LabAttemptRow;
  findRecentByLabId(labId: string, limit: number): LabAttemptRow[];
}

export function createLabAttemptRepository(
  db: Database.Database,
): LabAttemptRepository {
  const insertStmt = db.prepare(`
    INSERT INTO lab_attempts (lab_id, outcome, passed_tests, total_tests, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  const findRecentStmt = db.prepare(`
    SELECT * FROM lab_attempts
    WHERE lab_id = ?
    ORDER BY id DESC
    LIMIT ?
  `);

  return {
    insert(
      labId: string,
      outcome: LabAttemptOutcome,
      passedTests: number,
      totalTests: number,
      createdAt: string,
    ): LabAttemptRow {
      const result = insertStmt.run(
        labId,
        outcome,
        passedTests,
        totalTests,
        createdAt,
      );
      return {
        id: Number(result.lastInsertRowid),
        lab_id: labId,
        outcome,
        passed_tests: passedTests,
        total_tests: totalTests,
        created_at: createdAt,
      };
    },

    findRecentByLabId(labId: string, limit: number): LabAttemptRow[] {
      return findRecentStmt.all(labId, limit) as LabAttemptRow[];
    },
  };
}
