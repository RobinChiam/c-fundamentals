import type Database from "better-sqlite3";

export interface LabDraftRow {
  lab_id: string;
  file_id: string;
  content: string;
  base_revision: number;
  updated_at: string;
}

export interface LabDraftRepository {
  findByLabId(labId: string): LabDraftRow[];
  findOne(labId: string, fileId: string): LabDraftRow | undefined;
  upsert(
    labId: string,
    fileId: string,
    content: string,
    baseRevision: number,
    updatedAt: string,
  ): void;
  deleteOne(labId: string, fileId: string): void;
  deleteByLabId(labId: string): void;
}

export function createLabDraftRepository(db: Database.Database): LabDraftRepository {
  const findByLabStmt = db.prepare(
    "SELECT * FROM lab_drafts WHERE lab_id = ?",
  );
  const findOneStmt = db.prepare(
    "SELECT * FROM lab_drafts WHERE lab_id = ? AND file_id = ?",
  );
  const upsertStmt = db.prepare(`
    INSERT INTO lab_drafts (lab_id, file_id, content, base_revision, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(lab_id, file_id) DO UPDATE SET
      content = excluded.content,
      base_revision = excluded.base_revision,
      updated_at = excluded.updated_at
  `);
  const deleteOneStmt = db.prepare(
    "DELETE FROM lab_drafts WHERE lab_id = ? AND file_id = ?",
  );
  const deleteByLabStmt = db.prepare(
    "DELETE FROM lab_drafts WHERE lab_id = ?",
  );

  return {
    findByLabId(labId: string): LabDraftRow[] {
      return findByLabStmt.all(labId) as LabDraftRow[];
    },

    findOne(labId: string, fileId: string): LabDraftRow | undefined {
      return findOneStmt.get(labId, fileId) as LabDraftRow | undefined;
    },

    upsert(
      labId: string,
      fileId: string,
      content: string,
      baseRevision: number,
      updatedAt: string,
    ): void {
      upsertStmt.run(labId, fileId, content, baseRevision, updatedAt);
    },

    deleteOne(labId: string, fileId: string): void {
      deleteOneStmt.run(labId, fileId);
    },

    deleteByLabId(labId: string): void {
      deleteByLabStmt.run(labId);
    },
  };
}
