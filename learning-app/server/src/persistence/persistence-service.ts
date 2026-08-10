import { createHash } from "node:crypto";
import type {
  DraftListResponse,
  LearningState,
  LessonProgress,
  PersistenceStatus,
  SavedDraft,
} from "@learning-app/shared";
import type Database from "better-sqlite3";
import { MAX_FILE_BYTES } from "../compiler/compiler-limits.js";
import {
  LessonFileNotFoundError,
  LessonNotFoundError,
  type CurriculumService,
} from "../curriculum/curriculum-service.js";
import {
  DraftPayloadTooLargeError,
  NonEditableFileError,
  PersistenceUnavailableError,
} from "./persistence-errors.js";
import {
  createAppStateRepository,
  type AppStateRepository,
} from "./repositories/app-state-repository.js";
import {
  createDraftRepository,
  type DraftRepository,
} from "./repositories/draft-repository.js";
import {
  createProgressRepository,
  type ProgressRepository,
} from "./repositories/progress-repository.js";

const EDITABLE_ROLES = new Set(["primary", "support", "header"]);

export function sha256Content(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

export interface PersistenceService {
  getStatus(): PersistenceStatus;
  getLearningState(): LearningState;
  visitLesson(lessonId: string): LessonProgress;
  updateProgress(
    lessonId: string,
    status: "in_progress" | "completed",
  ): LessonProgress;
  listDrafts(lessonId: string): Promise<DraftListResponse>;
  saveDraft(
    lessonId: string,
    fileId: string,
    content: string,
  ): Promise<SavedDraft>;
  deleteDraft(lessonId: string, fileId: string): void;
  deleteAllDrafts(lessonId: string): void;
  close(): void;
}

export interface PersistenceServiceDependencies {
  db: Database.Database;
  curriculumService: CurriculumService;
  draftRepository?: DraftRepository;
  progressRepository?: ProgressRepository;
  appStateRepository?: AppStateRepository;
  closeDatabase?: () => void;
}

function toLessonProgress(row: {
  lesson_id: string;
  status: "in_progress" | "completed";
  last_visited_at: string;
  completed_at: string | null;
  updated_at: string;
}): LessonProgress {
  return {
    lessonId: row.lesson_id,
    status: row.status,
    lastVisitedAt: row.last_visited_at,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
  };
}

function assertEditableFile(
  curriculumService: CurriculumService,
  lessonId: string,
  fileId: string,
): void {
  const lesson = curriculumService.getLessonDetail(lessonId);
  const file = lesson.files.find((entry) => entry.id === fileId);
  if (!file) {
    throw new LessonFileNotFoundError(lessonId, fileId);
  }
  if (!EDITABLE_ROLES.has(file.role)) {
    throw new NonEditableFileError(lessonId, fileId);
  }
}

function assertDraftSize(content: string): void {
  const bytes = Buffer.byteLength(content, "utf8");
  if (bytes > MAX_FILE_BYTES) {
    throw new DraftPayloadTooLargeError(
      `Draft content exceeds maximum size of ${MAX_FILE_BYTES} bytes`,
    );
  }
}

export function createPersistenceService(
  dependencies: PersistenceServiceDependencies,
): PersistenceService {
  const draftRepository =
    dependencies.draftRepository ?? createDraftRepository(dependencies.db);
  const progressRepository =
    dependencies.progressRepository ??
    createProgressRepository(dependencies.db);
  const appStateRepository =
    dependencies.appStateRepository ??
    createAppStateRepository(dependencies.db);
  const { curriculumService } = dependencies;

  async function getCurrentSourceHash(
    lessonId: string,
    fileId: string,
  ): Promise<string | null> {
    try {
      const fileContent = await curriculumService.getLessonFileContent(
        lessonId,
        fileId,
      );
      return sha256Content(fileContent.content);
    } catch (error) {
      if (
        error instanceof LessonNotFoundError ||
        error instanceof LessonFileNotFoundError
      ) {
        return null;
      }
      throw error;
    }
  }

  return {
    getStatus(): PersistenceStatus {
      return {
        available: true,
        database: "sqlite",
        reason: null,
      };
    },

    getLearningState(): LearningState {
      const appState = appStateRepository.get();
      const progressRows = progressRepository.findAll();
      const knownLessonIds = new Set(
        curriculumService.listLessons().map((lesson) => lesson.id),
      );

      const lessons = progressRows
        .filter((row) => knownLessonIds.has(row.lesson_id))
        .map(toLessonProgress);

      const lastLessonId =
        appState?.last_lesson_id &&
        knownLessonIds.has(appState.last_lesson_id)
          ? appState.last_lesson_id
          : null;

      return {
        lastLessonId,
        lessons,
      };
    },

    visitLesson(lessonId: string): LessonProgress {
      curriculumService.getLessonDetail(lessonId);

      const now = new Date().toISOString();
      const visit = dependencies.db.transaction(() => {
        appStateRepository.setLastLessonId(lessonId, now);
        return progressRepository.upsertVisit(lessonId, now, now);
      });

      return toLessonProgress(visit());
    },

    updateProgress(
      lessonId: string,
      status: "in_progress" | "completed",
    ): LessonProgress {
      curriculumService.getLessonDetail(lessonId);

      const now = new Date().toISOString();
      const completedAt = status === "completed" ? now : null;

      const row = progressRepository.updateStatus(
        lessonId,
        status,
        now,
        completedAt,
        now,
      );

      return toLessonProgress(row);
    },

    async listDrafts(lessonId: string): Promise<DraftListResponse> {
      curriculumService.getLessonDetail(lessonId);

      const rows = draftRepository.findByLesson(lessonId);
      const drafts: SavedDraft[] = [];

      for (const row of rows) {
        try {
          assertEditableFile(curriculumService, lessonId, row.file_id);
        } catch (error) {
          if (error instanceof NonEditableFileError) {
            continue;
          }
          if (error instanceof LessonFileNotFoundError) {
            continue;
          }
          throw error;
        }

        const currentHash = await getCurrentSourceHash(lessonId, row.file_id);
        const stale =
          currentHash === null || currentHash !== row.base_content_sha256;

        drafts.push({
          lessonId: row.lesson_id,
          fileId: row.file_id,
          content: row.content,
          updatedAt: row.updated_at,
          stale,
        });
      }

      return { lessonId, drafts };
    },

    async saveDraft(
      lessonId: string,
      fileId: string,
      content: string,
    ): Promise<SavedDraft> {
      assertEditableFile(curriculumService, lessonId, fileId);
      assertDraftSize(content);

      const fileContent = await curriculumService.getLessonFileContent(
        lessonId,
        fileId,
      );
      const baseHash = sha256Content(fileContent.content);
      const now = new Date().toISOString();

      draftRepository.upsert(lessonId, fileId, content, baseHash, now);

      return {
        lessonId,
        fileId,
        content,
        updatedAt: now,
        stale: false,
      };
    },

    deleteDraft(lessonId: string, fileId: string): void {
      draftRepository.deleteOne(lessonId, fileId);
    },

    deleteAllDrafts(lessonId: string): void {
      const deleteAll = dependencies.db.transaction(() => {
        draftRepository.deleteByLesson(lessonId);
      });
      deleteAll();
    },

    close(): void {
      dependencies.closeDatabase?.();
    },
  };
}

export function createUnavailablePersistenceService(): PersistenceService {
  const unavailable = (): never => {
    throw new PersistenceUnavailableError();
  };

  return {
    getStatus(): PersistenceStatus {
      return {
        available: false,
        database: "sqlite",
        reason: "initialization_failed",
      };
    },
    getLearningState: unavailable,
    visitLesson: unavailable,
    updateProgress: unavailable,
    listDrafts: async () => unavailable(),
    saveDraft: async () => unavailable(),
    deleteDraft: unavailable,
    deleteAllDrafts: unavailable,
    close(): void {
      // no-op
    },
  };
}
