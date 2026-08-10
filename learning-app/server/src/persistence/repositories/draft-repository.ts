import type Database from "better-sqlite3";

export interface DraftRow {
  lesson_id: string;
  file_id: string;
  content: string;
  base_content_sha256: string;
  updated_at: string;
}

export interface DraftRepository {
  findByLesson(lessonId: string): DraftRow[];
  findOne(lessonId: string, fileId: string): DraftRow | undefined;
  upsert(
    lessonId: string,
    fileId: string,
    content: string,
    baseContentSha256: string,
    updatedAt: string,
  ): void;
  deleteOne(lessonId: string, fileId: string): void;
  deleteByLesson(lessonId: string): void;
}

export function createDraftRepository(db: Database.Database): DraftRepository {
  const findByLessonStmt = db.prepare(`
    SELECT lesson_id, file_id, content, base_content_sha256, updated_at
    FROM lesson_drafts
    WHERE lesson_id = ?
    ORDER BY file_id ASC
  `);

  const findOneStmt = db.prepare(`
    SELECT lesson_id, file_id, content, base_content_sha256, updated_at
    FROM lesson_drafts
    WHERE lesson_id = ? AND file_id = ?
  `);

  const upsertStmt = db.prepare(`
    INSERT INTO lesson_drafts (
      lesson_id, file_id, content, base_content_sha256, updated_at
    ) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (lesson_id, file_id) DO UPDATE SET
      content = excluded.content,
      base_content_sha256 = excluded.base_content_sha256,
      updated_at = excluded.updated_at
  `);

  const deleteOneStmt = db.prepare(`
    DELETE FROM lesson_drafts
    WHERE lesson_id = ? AND file_id = ?
  `);

  const deleteByLessonStmt = db.prepare(`
    DELETE FROM lesson_drafts
    WHERE lesson_id = ?
  `);

  return {
    findByLesson(lessonId: string): DraftRow[] {
      return findByLessonStmt.all(lessonId) as DraftRow[];
    },

    findOne(lessonId: string, fileId: string): DraftRow | undefined {
      return findOneStmt.get(lessonId, fileId) as DraftRow | undefined;
    },

    upsert(
      lessonId: string,
      fileId: string,
      content: string,
      baseContentSha256: string,
      updatedAt: string,
    ): void {
      upsertStmt.run(
        lessonId,
        fileId,
        content,
        baseContentSha256,
        updatedAt,
      );
    },

    deleteOne(lessonId: string, fileId: string): void {
      deleteOneStmt.run(lessonId, fileId);
    },

    deleteByLesson(lessonId: string): void {
      deleteByLessonStmt.run(lessonId);
    },
  };
}
