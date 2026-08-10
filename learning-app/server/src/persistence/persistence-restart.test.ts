import { rmSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createCurriculumService,
} from "../curriculum/curriculum-service.js";
import { resolveDefaultRepositoryRoot } from "../curriculum/repository-root.js";
import { createPersistenceService } from "../persistence/persistence-service.js";
import { createTempDatabase, reopenTempDatabase } from "../persistence/persistence-test-utils.js";

describe("persistence restart integration", () => {
  it("restores draft, progress, and last lesson after full reopen", async () => {
    const temp = createTempDatabase();
    const repositoryRoot = resolveDefaultRepositoryRoot();
    const curriculumService = createCurriculumService({ repositoryRoot });

    const firstService = createPersistenceService({
      db: temp.db,
      curriculumService,
      closeDatabase: temp.close,
    });

    await firstService.saveDraft("arrays", "primary", "persisted across restart");
    firstService.updateProgress("arrays", "completed");
    firstService.visitLesson("arrays");
    firstService.close();

    const reopened = reopenTempDatabase(temp.databasePath);
    const secondService = createPersistenceService({
      db: reopened.db,
      curriculumService,
    });

    const drafts = await secondService.listDrafts("arrays");
    expect(drafts.drafts[0]?.content).toBe("persisted across restart");

    const state = secondService.getLearningState();
    expect(state.lastLessonId).toBe("arrays");
    expect(state.lessons.find((lesson) => lesson.lessonId === "arrays")?.status).toBe(
      "completed",
    );

    secondService.close();
    reopened.close();
    rmSync(temp.tempDirectory, { recursive: true, force: true });
  });
});
