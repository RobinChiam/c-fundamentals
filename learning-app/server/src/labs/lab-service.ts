import type {
  HintRevealResponse,
  LabAttemptListResponse,
  LabDetail,
  LabDraft,
  LabDraftListResponse,
  LabEvaluationRequest,
  LabEvaluationResponse,
  LabStatus,
  LabSummary,
  SolutionRevealResponse,
} from "@learning-app/shared";
import type Database from "better-sqlite3";
import { MAX_FILE_BYTES } from "../compiler/compiler-limits.js";
import type { CurriculumService } from "../curriculum/curriculum-service.js";
import { PersistenceUnavailableError } from "../persistence/persistence-errors.js";
import type { PersistenceService } from "../persistence/persistence-service.js";
import type { LabEvaluator } from "./lab-evaluator.js";
import { createLabEvaluator } from "./lab-evaluator.js";
import {
  LabDraftPayloadTooLargeError,
  LabHintRevealError,
  LabLessonMismatchError,
  LabNotFoundError,
  LabStarterFileNotFoundError,
} from "./lab-errors.js";
import {
  LAB_REGISTRY_BY_ID,
  LAB_REGISTRY_BY_LESSON,
} from "./lab-registry.js";
import type { LabDefinition } from "./lab-types.js";
import {
  createLabAttemptRepository,
  type LabAttemptRepository,
} from "./repositories/lab-attempt-repository.js";
import {
  createLabDraftRepository,
  type LabDraftRepository,
} from "./repositories/lab-draft-repository.js";
import {
  createLabStateRepository,
  type LabStateRepository,
} from "./repositories/lab-state-repository.js";

export interface LabServiceOptions {
  curriculumService: CurriculumService;
  persistenceService: PersistenceService;
  labEvaluator?: LabEvaluator;
  db?: Database.Database;
  labDraftRepository?: LabDraftRepository;
  labStateRepository?: LabStateRepository;
  labAttemptRepository?: LabAttemptRepository;
}

export interface LabService {
  listLabsForLesson(lessonId: string): LabSummary[];
  getLabDetail(labId: string): LabDetail;
  listDrafts(labId: string): LabDraftListResponse;
  saveDraft(labId: string, fileId: string, content: string): Promise<LabDraft>;
  deleteDraft(labId: string, fileId: string): void;
  deleteAllDrafts(labId: string): void;
  evaluate(labId: string, request: LabEvaluationRequest): Promise<LabEvaluationResponse>;
  revealHint(labId: string, hintIndex: number): HintRevealResponse;
  revealSolution(labId: string): Promise<SolutionRevealResponse>;
  listAttempts(labId: string): LabAttemptListResponse;
  getLabDefinition(labId: string): LabDefinition;
  assertLabBelongsToLesson(labId: string, lessonId: string): void;
}

function assertDraftSize(content: string): void {
  const bytes = Buffer.byteLength(content, "utf8");
  if (bytes > MAX_FILE_BYTES) {
    throw new LabDraftPayloadTooLargeError(
      `Lab draft content exceeds maximum size of ${MAX_FILE_BYTES} bytes`,
    );
  }
}

function resolveStatus(state: ReturnType<LabStateRepository["findByLabId"]>): LabStatus {
  if (!state) {
    return "not_started";
  }
  if (state.completed_at) {
    return "completed";
  }
  return "in_progress";
}

function toLabSummary(lab: LabDefinition, status: LabStatus): LabSummary {
  return {
    id: lab.id,
    lessonId: lab.lessonId,
    exerciseNumber: lab.exerciseNumber,
    title: lab.title,
    revision: lab.revision,
    status,
  };
}

function getStarterContent(lab: LabDefinition, fileId: string): string {
  const starter = lab.starterFiles.find((file) => file.id === fileId);
  if (!starter) {
    throw new LabStarterFileNotFoundError(lab.id, fileId);
  }
  return starter.content;
}

export function createLabService(options: LabServiceOptions): LabService {
  const { curriculumService, persistenceService } = options;
  const labEvaluator = options.labEvaluator ?? createLabEvaluator();
  const persistenceAvailable = () => {
    try {
      return persistenceService.getStatus().available;
    } catch {
      return false;
    }
  };

  const getRepositories = (): {
    draftRepository: LabDraftRepository;
    stateRepository: LabStateRepository;
    attemptRepository: LabAttemptRepository;
  } | null => {
    if (!options.db || !persistenceAvailable()) {
      return null;
    }

    return {
      draftRepository:
        options.labDraftRepository ?? createLabDraftRepository(options.db),
      stateRepository:
        options.labStateRepository ?? createLabStateRepository(options.db),
      attemptRepository:
        options.labAttemptRepository ?? createLabAttemptRepository(options.db),
    };
  };

  const getLab = (labId: string): LabDefinition => {
    const lab = LAB_REGISTRY_BY_ID.get(labId);
    if (!lab) {
      throw new LabNotFoundError(labId);
    }
    return lab;
  };

  const readState = (labId: string) => {
    const repos = getRepositories();
    if (!repos) {
      return undefined;
    }
    return repos.stateRepository.findByLabId(labId);
  };

  const ensureLabStarted = (labId: string) => {
    const repos = getRepositories();
    if (!repos) {
      return undefined;
    }
    const now = new Date().toISOString();
    return repos.stateRepository.ensureStarted(labId, now, now);
  };

  return {
    getLabDefinition(labId: string): LabDefinition {
      return getLab(labId);
    },

    assertLabBelongsToLesson(labId: string, lessonId: string): void {
      const lab = getLab(labId);
      if (lab.lessonId !== lessonId) {
        throw new LabLessonMismatchError(labId, lessonId);
      }
    },

    listLabsForLesson(lessonId: string): LabSummary[] {
      curriculumService.getLessonDetail(lessonId);
      const labs = LAB_REGISTRY_BY_LESSON.get(lessonId) ?? [];
      return labs.map((lab) => toLabSummary(lab, resolveStatus(readState(lab.id))));
    },

    getLabDetail(labId: string): LabDetail {
      const lab = getLab(labId);
      ensureLabStarted(labId);
      const state = readState(labId);
      const hintsRevealed = state?.hints_revealed ?? 0;

      return {
        id: lab.id,
        lessonId: lab.lessonId,
        exerciseNumber: lab.exerciseNumber,
        title: lab.title,
        revision: lab.revision,
        prompt: lab.prompt,
        concepts: lab.concepts,
        starterFiles: lab.starterFiles.map((file) => ({
          id: file.id,
          name: file.name,
          language: "c" as const,
          content: file.content,
        })),
        publicTests: lab.publicTests.map((test) => ({
          id: test.id,
          title: test.title,
          visibility: "public" as const,
        })),
        hiddenTests: lab.hiddenTests.map((test) => ({
          id: test.id,
          title: test.title,
          visibility: "hidden" as const,
        })),
        revealedHints: lab.hints
          .filter((hint) => hint.index < hintsRevealed)
          .map((hint) => ({
            index: hint.index,
            content: hint.content,
          })),
        solutionRevealed: Boolean(state?.solution_revealed_at),
        status: resolveStatus(state),
        progress: {
          hintsRevealed,
          solutionRevealed: Boolean(state?.solution_revealed_at),
          completedAt: state?.completed_at ?? null,
          lastAttemptAt: state?.last_attempt_at ?? null,
        },
      };
    },

    listDrafts(labId: string): LabDraftListResponse {
      const lab = getLab(labId);
      const repos = getRepositories();
      const rows = repos?.draftRepository.findByLabId(labId) ?? [];

      const drafts: LabDraft[] = rows
        .filter((row) => lab.starterFiles.some((file) => file.id === row.file_id))
        .map((row) => ({
          labId: row.lab_id,
          fileId: row.file_id,
          content: row.content,
          baseRevision: row.base_revision,
          updatedAt: row.updated_at,
          stale: row.base_revision !== lab.revision,
        }));

      return {
        labId,
        revision: lab.revision,
        drafts,
      };
    },

    async saveDraft(labId: string, fileId: string, content: string): Promise<LabDraft> {
      const lab = getLab(labId);
      getStarterContent(lab, fileId);
      assertDraftSize(content);

      const now = new Date().toISOString();
      ensureLabStarted(labId);

      const repos = getRepositories();
      if (!repos) {
        throw new PersistenceUnavailableError();
      }

      repos.draftRepository.upsert(labId, fileId, content, lab.revision, now);

      return {
        labId,
        fileId,
        content,
        baseRevision: lab.revision,
        updatedAt: now,
        stale: false,
      };
    },

    deleteDraft(labId: string, fileId: string): void {
      getLab(labId);
      getStarterContent(getLab(labId), fileId);
      const repos = getRepositories();
      if (!repos) {
        throw new PersistenceUnavailableError();
      }
      repos.draftRepository.deleteOne(labId, fileId);
    },

    deleteAllDrafts(labId: string): void {
      getLab(labId);
      const repos = getRepositories();
      if (!repos) {
        throw new PersistenceUnavailableError();
      }
      repos.draftRepository.deleteByLabId(labId);
    },

    async evaluate(
      labId: string,
      request: LabEvaluationRequest,
    ): Promise<LabEvaluationResponse> {
      const lab = getLab(labId);
      ensureLabStarted(labId);

      const submission = request.files.find(
        (file) => file.id === lab.evaluation.submissionFileId,
      );
      if (!submission) {
        throw new LabStarterFileNotFoundError(
          labId,
          lab.evaluation.submissionFileId,
        );
      }

      const response = await labEvaluator.evaluate({
        lab,
        submissionContent: submission.content,
      });

      const repos = getRepositories();
      if (!repos || !options.db) {
        return {
          ...response,
          attemptPersisted: false,
        };
      }

      const now = new Date().toISOString();

      try {
        const record = options.db.transaction(() => {
          repos.attemptRepository.insert(
            labId,
            response.outcome,
            response.passedTests,
            response.totalTests,
            now,
          );
          repos.stateRepository.recordAttempt(labId, now, now);
          if (response.outcome === "passed") {
            repos.stateRepository.markCompleted(labId, now, now);
          }
        });
        record();
      } catch {
        return {
          ...response,
          attemptPersisted: false,
        };
      }

      return {
        ...response,
        attemptPersisted: true,
      };
    },

    revealHint(labId: string, hintIndex: number): HintRevealResponse {
      const lab = getLab(labId);
      ensureLabStarted(labId);

      const hint = lab.hints.find((entry) => entry.index === hintIndex);
      if (!hint) {
        throw new LabHintRevealError(`Hint ${hintIndex} does not exist`);
      }

      const repos = getRepositories();
      if (!repos) {
        throw new PersistenceUnavailableError();
      }

      const state = repos.stateRepository.findByLabId(labId);
      const hintsRevealed = state?.hints_revealed ?? 0;
      if (hintIndex !== hintsRevealed) {
        throw new LabHintRevealError(
          `Hint ${hintIndex} cannot be revealed before earlier hints`,
        );
      }

      const now = new Date().toISOString();
      repos.stateRepository.updateHintsRevealed(labId, hintIndex + 1, now);

      return {
        index: hint.index,
        content: hint.content,
        hintsRevealed: hintIndex + 1,
      };
    },

    async revealSolution(labId: string): Promise<SolutionRevealResponse> {
      const lab = getLab(labId);
      ensureLabStarted(labId);

      const repos = getRepositories();
      if (!repos) {
        throw new PersistenceUnavailableError();
      }

      const solution = await curriculumService.getLessonFileContent(
        lab.lessonId,
        lab.solutionFileId,
      );

      const now = new Date().toISOString();
      repos.stateRepository.revealSolution(labId, now, now);

      return {
        fileName: solution.file.name,
        content: solution.content,
        solutionRevealed: true,
      };
    },

    listAttempts(labId: string): LabAttemptListResponse {
      getLab(labId);
      const repos = getRepositories();
      const attempts =
        repos?.attemptRepository.findRecentByLabId(labId, 20).map((row) => ({
          id: row.id,
          outcome: row.outcome,
          passedTests: row.passed_tests,
          totalTests: row.total_tests,
          createdAt: row.created_at,
        })) ?? [];

      return {
        labId,
        attempts,
      };
    },
  };
}

export function createUnavailableLabService(
  curriculumService: CurriculumService,
): LabService {
  const unavailable = (): never => {
    throw new PersistenceUnavailableError();
  };

  const labEvaluator = createLabEvaluator();

  return {
    getLabDefinition(labId: string): LabDefinition {
      const lab = LAB_REGISTRY_BY_ID.get(labId);
      if (!lab) {
        throw new LabNotFoundError(labId);
      }
      return lab;
    },
    assertLabBelongsToLesson(labId: string, lessonId: string): void {
      const lab = LAB_REGISTRY_BY_ID.get(labId);
      if (!lab) {
        throw new LabNotFoundError(labId);
      }
      if (lab.lessonId !== lessonId) {
        throw new LabLessonMismatchError(labId, lessonId);
      }
    },
    listLabsForLesson(lessonId: string): LabSummary[] {
      curriculumService.getLessonDetail(lessonId);
      const labs = LAB_REGISTRY_BY_LESSON.get(lessonId) ?? [];
      return labs.map((lab) => toLabSummary(lab, "not_started"));
    },
    getLabDetail(labId: string): LabDetail {
      const lab = LAB_REGISTRY_BY_ID.get(labId);
      if (!lab) {
        throw new LabNotFoundError(labId);
      }
      return {
        id: lab.id,
        lessonId: lab.lessonId,
        exerciseNumber: lab.exerciseNumber,
        title: lab.title,
        revision: lab.revision,
        prompt: lab.prompt,
        concepts: lab.concepts,
        starterFiles: lab.starterFiles.map((file) => ({
          id: file.id,
          name: file.name,
          language: "c" as const,
          content: file.content,
        })),
        publicTests: lab.publicTests.map((test) => ({
          id: test.id,
          title: test.title,
          visibility: "public" as const,
        })),
        hiddenTests: lab.hiddenTests.map((test) => ({
          id: test.id,
          title: test.title,
          visibility: "hidden" as const,
        })),
        revealedHints: [],
        solutionRevealed: false,
        status: "not_started",
        progress: {
          hintsRevealed: 0,
          solutionRevealed: false,
          completedAt: null,
          lastAttemptAt: null,
        },
      };
    },
    listDrafts: unavailable,
    saveDraft: async () => unavailable(),
    deleteDraft: unavailable,
    deleteAllDrafts: unavailable,
    async evaluate(labId: string, request: LabEvaluationRequest) {
      const lab = LAB_REGISTRY_BY_ID.get(labId);
      if (!lab) {
        throw new LabNotFoundError(labId);
      }
      const submission = request.files.find(
        (file) => file.id === lab.evaluation.submissionFileId,
      );
      if (!submission) {
        throw new LabStarterFileNotFoundError(
          labId,
          lab.evaluation.submissionFileId,
        );
      }
      const response = await labEvaluator.evaluate({
        lab,
        submissionContent: submission.content,
      });
      return { ...response, attemptPersisted: false };
    },
    revealHint: unavailable,
    revealSolution: async () => unavailable(),
    listAttempts(labId: string): LabAttemptListResponse {
      getLab(labId);
      return { labId, attempts: [] };
    },
  };
}

function getLab(labId: string): LabDefinition {
  const lab = LAB_REGISTRY_BY_ID.get(labId);
  if (!lab) {
    throw new LabNotFoundError(labId);
  }
  return lab;
}
