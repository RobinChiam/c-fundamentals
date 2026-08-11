import { afterEach, describe, expect, it } from "vitest";
import { createCurriculumService } from "../curriculum/curriculum-service.js";
import { resolveDefaultRepositoryRoot } from "../curriculum/repository-root.js";
import { createPersistenceService } from "../persistence/persistence-service.js";
import { createTempDatabase } from "../persistence/persistence-test-utils.js";
import { createLabService } from "./lab-service.js";

describe("lab draft persistence", () => {
  const curriculumService = createCurriculumService({
    repositoryRoot: resolveDefaultRepositoryRoot(),
  });
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.();
    }
  });

  function createService() {
    const temp = createTempDatabase();
    cleanups.push(temp.cleanup);
    const persistence = createPersistenceService({
      db: temp.db,
      curriculumService,
      closeDatabase: temp.close,
    });
    const service = createLabService({
      curriculumService,
      persistenceService: persistence,
      db: temp.db,
    });
    return { service, temp, persistence };
  }

  it("marks old revision drafts as stale without auto-applying", async () => {
    const { service, temp } = createService();
    temp.db
      .prepare(
        "INSERT INTO lab_drafts (lab_id, file_id, content, base_revision, updated_at) VALUES (?, ?, ?, ?, ?)",
      )
      .run(
        "conditional-leap-year",
        "submission",
        "stale draft body",
        999,
        new Date().toISOString(),
      );

    const drafts = service.listDrafts("conditional-leap-year");
    expect(drafts.drafts[0]?.stale).toBe(true);
    expect(drafts.drafts[0]?.content).toBe("stale draft body");
  });

  it("reset deletes persisted lab draft", async () => {
    const { service } = createService();
    await service.saveDraft(
      "conditional-leap-year",
      "submission",
      "temporary draft",
    );
    service.deleteAllDrafts("conditional-leap-year");
    expect(service.listDrafts("conditional-leap-year").drafts).toHaveLength(0);
  });

  it("lesson reset all does not delete lab drafts", async () => {
    const { service, persistence } = createService();
    await persistence.saveDraft("arrays", "primary", "lesson draft");
    await service.saveDraft("arrays-count-above", "submission", "lab draft");
    persistence.deleteAllDrafts("arrays");
    const labDrafts = service.listDrafts("arrays-count-above");
    expect(labDrafts.drafts[0]?.content).toBe("lab draft");
  });
});
