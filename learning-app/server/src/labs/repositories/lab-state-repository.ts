import type Database from "better-sqlite3";

export interface LabStateRow {
  lab_id: string;
  started_at: string;
  hints_revealed: number;
  solution_revealed_at: string | null;
  completed_at: string | null;
  last_attempt_at: string | null;
  updated_at: string;
}

export interface LabStateRepository {
  findByLabId(labId: string): LabStateRow | undefined;
  ensureStarted(labId: string, startedAt: string, updatedAt: string): LabStateRow;
  updateHintsRevealed(labId: string, hintsRevealed: number, updatedAt: string): void;
  revealSolution(labId: string, revealedAt: string, updatedAt: string): void;
  markCompleted(labId: string, completedAt: string, updatedAt: string): void;
  recordAttempt(labId: string, lastAttemptAt: string, updatedAt: string): void;
}

export function createLabStateRepository(db: Database.Database): LabStateRepository {
  const findStmt = db.prepare(
    "SELECT * FROM lab_state WHERE lab_id = ?",
  );
  const insertStmt = db.prepare(`
    INSERT INTO lab_state (
      lab_id, started_at, hints_revealed, solution_revealed_at,
      completed_at, last_attempt_at, updated_at
    ) VALUES (?, ?, 0, NULL, NULL, NULL, ?)
  `);
  const updateHintsStmt = db.prepare(
    "UPDATE lab_state SET hints_revealed = ?, updated_at = ? WHERE lab_id = ?",
  );
  const revealSolutionStmt = db.prepare(
    "UPDATE lab_state SET solution_revealed_at = ?, updated_at = ? WHERE lab_id = ?",
  );
  const markCompletedStmt = db.prepare(
    "UPDATE lab_state SET completed_at = ?, updated_at = ? WHERE lab_id = ?",
  );
  const recordAttemptStmt = db.prepare(
    "UPDATE lab_state SET last_attempt_at = ?, updated_at = ? WHERE lab_id = ?",
  );

  return {
    findByLabId(labId: string): LabStateRow | undefined {
      return findStmt.get(labId) as LabStateRow | undefined;
    },

    ensureStarted(labId: string, startedAt: string, updatedAt: string): LabStateRow {
      const existing = findStmt.get(labId) as LabStateRow | undefined;
      if (existing) {
        return existing;
      }
      insertStmt.run(labId, startedAt, updatedAt);
      return findStmt.get(labId) as LabStateRow;
    },

    updateHintsRevealed(labId: string, hintsRevealed: number, updatedAt: string): void {
      updateHintsStmt.run(hintsRevealed, updatedAt, labId);
    },

    revealSolution(labId: string, revealedAt: string, updatedAt: string): void {
      revealSolutionStmt.run(revealedAt, updatedAt, labId);
    },

    markCompleted(labId: string, completedAt: string, updatedAt: string): void {
      markCompletedStmt.run(completedAt, updatedAt, labId);
    },

    recordAttempt(labId: string, lastAttemptAt: string, updatedAt: string): void {
      recordAttemptStmt.run(lastAttemptAt, updatedAt, labId);
    },
  };
}
