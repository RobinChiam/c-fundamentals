import { rmSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import type Database from "better-sqlite3";
import {
  createCurriculumService,
  LessonFileNotFoundError,
  LessonNotFoundError,
} from "../curriculum/curriculum-service.js";
import { resolveDefaultRepositoryRoot } from "../curriculum/repository-root.js";
import { MAX_FILE_BYTES } from "../compiler/compiler-limits.js";
import { NonEditableFileError } from "./persistence-errors.js";
import {
  createPersistenceService,
  sha256Content,
} from "./persistence-service.js";
import {
  getAppliedMigrationVersions,
  MIGRATIONS,
  runMigrations,
} from "./migrations.js";
import {
  createTempDatabase,
  createTempDatabaseDirectory,
  reopenTempDatabase,
} from "./persistence-test-utils.js";

describe("persistence service", () => {
  const repositoryRoot = resolveDefaultRepositoryRoot();
  const curriculumService = createCurriculumService({ repositoryRoot });
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.();
    }
  });

  function createService() {
    const temp = createTempDatabase();
    cleanups.push(temp.cleanup);
    const service = createPersistenceService({
      db: temp.db,
      curriculumService,
      closeDatabase: temp.close,
    });
    return { service, temp };
  }

  it("editable draft saves", async () => {
    const { service } = createService();
    const saved = await service.saveDraft("arrays", "primary", "edited draft");
    expect(saved.content).toBe("edited draft");
    expect(saved.stale).toBe(false);
  });

  it("upsert updates existing draft", async () => {
    const { service } = createService();
    await service.saveDraft("arrays", "primary", "first");
    const updated = await service.saveDraft("arrays", "primary", "second");
    expect(updated.content).toBe("second");
    const list = await service.listDrafts("arrays");
    expect(list.drafts).toHaveLength(1);
  });

  it("draft survives DB close/reopen", async () => {
    const temp = createTempDatabase();
    const databasePath = temp.databasePath;
    const first = createPersistenceService({
      db: temp.db,
      curriculumService,
    });
    await first.saveDraft("arrays", "primary", "persisted draft");
    first.close();

    const reopened = reopenTempDatabase(databasePath);
    cleanups.push(() => {
      reopened.close();
      rmSync(temp.tempDirectory, { recursive: true, force: true });
    });
    const second = createPersistenceService({
      db: reopened.db,
      curriculumService,
    });
    const list = await second.listDrafts("arrays");
    expect(list.drafts[0]?.content).toBe("persisted draft");
  });

  it("primary file accepted", async () => {
    const { service } = createService();
    await expect(
      service.saveDraft("arrays", "primary", "ok"),
    ).resolves.toBeDefined();
  });

  it("support file accepted", async () => {
    const { service } = createService();
    await expect(
      service.saveDraft(
        "header-files-and-multiple-source-files",
        "geometry",
        "ok",
      ),
    ).resolves.toBeDefined();
  });

  it("header accepted", async () => {
    const { service } = createService();
    await expect(
      service.saveDraft(
        "header-files-and-multiple-source-files",
        "geometry-header",
        "ok",
      ),
    ).resolves.toBeDefined();
  });

  it("README rejected", async () => {
    const { service } = createService();
    await expect(service.saveDraft("arrays", "readme", "nope")).rejects.toBeInstanceOf(
      NonEditableFileError,
    );
  });

  it("solution rejected", async () => {
    const { service } = createService();
    await expect(
      service.saveDraft("arrays", "solution", "nope"),
    ).rejects.toBeInstanceOf(NonEditableFileError);
  });

  it("unknown lesson rejected", () => {
    const { service } = createService();
    expect(() => service.visitLesson("missing-lesson")).toThrow(LessonNotFoundError);
  });

  it("unknown file rejected", async () => {
    const { service } = createService();
    await expect(
      service.saveDraft("arrays", "missing-file", "nope"),
    ).rejects.toBeInstanceOf(LessonFileNotFoundError);
  });

  it("source base hash is calculated server-side", async () => {
    const { service, temp } = createService();
    await service.saveDraft("arrays", "primary", "draft");
    const row = temp.db
      .prepare(
        "SELECT base_content_sha256 FROM lesson_drafts WHERE lesson_id = ? AND file_id = ?",
      )
      .get("arrays", "primary") as { base_content_sha256: string };

    const source = await curriculumService.getLessonFileContent("arrays", "primary");
    expect(row.base_content_sha256).toBe(sha256Content(source.content));
  });

  it("same-source draft returns stale=false", async () => {
    const { service } = createService();
    await service.saveDraft("arrays", "primary", "draft");
    const list = await service.listDrafts("arrays");
    expect(list.drafts[0]?.stale).toBe(false);
  });

  it("changed authoritative source returns stale=true", async () => {
    const { service, temp } = createService();
    await service.saveDraft("arrays", "primary", "draft");
    temp.db
      .prepare(
        "UPDATE lesson_drafts SET base_content_sha256 = ? WHERE lesson_id = ? AND file_id = ?",
      )
      .run("deadbeef", "arrays", "primary");
    const list = await service.listDrafts("arrays");
    expect(list.drafts[0]?.stale).toBe(true);
  });

  it("delete file draft works", async () => {
    const { service } = createService();
    await service.saveDraft("arrays", "primary", "draft");
    service.deleteDraft("arrays", "primary");
    const list = await service.listDrafts("arrays");
    expect(list.drafts).toHaveLength(0);
  });

  it("deleting missing draft is idempotent", () => {
    const { service } = createService();
    expect(() => service.deleteDraft("arrays", "primary")).not.toThrow();
  });

  it("delete all lesson drafts works", async () => {
    const { service } = createService();
    await service.saveDraft("arrays", "primary", "draft");
    service.deleteAllDrafts("arrays");
    const list = await service.listDrafts("arrays");
    expect(list.drafts).toHaveLength(0);
  });

  it("draft size limit enforced", async () => {
    const { service } = createService();
    const oversized = "x".repeat(MAX_FILE_BYTES + 1);
    await expect(
      service.saveDraft("arrays", "primary", oversized),
    ).rejects.toThrow(/maximum size/i);
  });

  it("new visit creates in_progress", () => {
    const { service } = createService();
    const progress = service.visitLesson("arrays");
    expect(progress.status).toBe("in_progress");
  });

  it("visit updates last visited", () => {
    const { service } = createService();
    const first = service.visitLesson("arrays");
    const second = service.visitLesson("arrays");
    expect(second.lastVisitedAt >= first.lastVisitedAt).toBe(true);
  });

  it("visit stores lastLessonId", () => {
    const { service } = createService();
    service.visitLesson("arrays");
    const state = service.getLearningState();
    expect(state.lastLessonId).toBe("arrays");
  });

  it("completed lesson is not downgraded by visit", () => {
    const { service } = createService();
    service.updateProgress("arrays", "completed");
    const progress = service.visitLesson("arrays");
    expect(progress.status).toBe("completed");
  });

  it("explicit complete persists", () => {
    const { service } = createService();
    const progress = service.updateProgress("arrays", "completed");
    expect(progress.status).toBe("completed");
  });

  it("completed_at generated", () => {
    const { service } = createService();
    const progress = service.updateProgress("arrays", "completed");
    expect(progress.completedAt).toBeTruthy();
  });

  it("explicit in_progress clears completed_at", () => {
    const { service } = createService();
    service.updateProgress("arrays", "completed");
    const progress = service.updateProgress("arrays", "in_progress");
    expect(progress.completedAt).toBeNull();
  });

  it("progress survives DB close/reopen", () => {
    const temp = createTempDatabase();
    const databasePath = temp.databasePath;
    const first = createPersistenceService({
      db: temp.db,
      curriculumService,
    });
    first.updateProgress("arrays", "completed");
    first.close();

    const reopened = reopenTempDatabase(databasePath);
    cleanups.push(() => {
      reopened.close();
      rmSync(temp.tempDirectory, { recursive: true, force: true });
    });
    const second = createPersistenceService({
      db: reopened.db,
      curriculumService,
    });
    const state = second.getLearningState();
    expect(state.lessons[0]?.status).toBe("completed");
  });

  it("unknown lesson cannot be visited", () => {
    const { service } = createService();
    expect(() => service.visitLesson("removed-lesson")).toThrow(LessonNotFoundError);
  });

  it("historic unknown progress does not crash learning-state retrieval", () => {
    const { service, temp } = createService();
    temp.db
      .prepare(
        "INSERT INTO lesson_progress (lesson_id, status, last_visited_at, completed_at, updated_at) VALUES (?, 'in_progress', ?, NULL, ?)",
      )
      .run(
        "removed-lesson",
        new Date().toISOString(),
        new Date().toISOString(),
      );
    expect(() => service.getLearningState()).not.toThrow();
    const state = service.getLearningState();
    expect(state.lessons.some((lesson) => lesson.lessonId === "removed-lesson")).toBe(
      false,
    );
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
