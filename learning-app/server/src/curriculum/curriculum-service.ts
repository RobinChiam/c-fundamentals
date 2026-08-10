import { access, readFile } from "node:fs/promises";
import path from "node:path";
import type {
  LessonDetail,
  LessonFileContent,
  LessonFileDescriptor,
  LessonSummary,
} from "@learning-app/shared";
import {
  CURRICULUM_MANIFEST,
  type ManifestLessonEntry,
  type ManifestLessonFileEntry,
} from "./manifest.js";

export class LessonNotFoundError extends Error {
  constructor(lessonId: string) {
    super(`Lesson not found: ${lessonId}`);
    this.name = "LessonNotFoundError";
  }
}

export class LessonFileNotFoundError extends Error {
  constructor(lessonId: string, fileId: string) {
    super(`File not found for lesson ${lessonId}: ${fileId}`);
    this.name = "LessonFileNotFoundError";
  }
}

export class CurriculumIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CurriculumIntegrityError";
  }
}

export interface CurriculumServiceOptions {
  repositoryRoot: string;
  manifest?: ManifestLessonEntry[];
}

export interface CurriculumService {
  listLessons(): LessonSummary[];
  getLessonDetail(lessonId: string): LessonDetail;
  getLessonFileContent(lessonId: string, fileId: string): Promise<LessonFileContent>;
}

function assertPathContained(
  resolvedPath: string,
  allowedRoot: string,
  context: string,
): void {
  const normalizedResolved = path.resolve(resolvedPath);
  const normalizedRoot = path.resolve(allowedRoot);
  const relative = path.relative(normalizedRoot, normalizedResolved);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new CurriculumIntegrityError(
      `${context} escapes allowed directory boundary`,
    );
  }
}

function toFileDescriptor(
  file: ManifestLessonFileEntry,
): LessonFileDescriptor {
  return {
    id: file.id,
    name: file.name,
    role: file.role,
    language: file.language,
  };
}

function toLessonSummary(lesson: ManifestLessonEntry): LessonSummary {
  return {
    id: lesson.id,
    lessonNumber: lesson.lessonNumber,
    sequence: lesson.sequence,
    title: lesson.title,
    difficulty: lesson.difficulty,
  };
}

export async function validateManifestIntegrity(
  repositoryRoot: string,
  manifest: ManifestLessonEntry[] = CURRICULUM_MANIFEST,
): Promise<void> {
  if (manifest.length !== 16) {
    throw new CurriculumIntegrityError(
      `Expected 16 curriculum entries, found ${manifest.length}`,
    );
  }

  const lessonIds = new Set<string>();
  const sequences = new Set<number>();
  let lessonNumberZeroCount = 0;

  for (const lesson of manifest) {
    if (lessonIds.has(lesson.id)) {
      throw new CurriculumIntegrityError(`Duplicate lesson id: ${lesson.id}`);
    }
    lessonIds.add(lesson.id);

    if (sequences.has(lesson.sequence)) {
      throw new CurriculumIntegrityError(
        `Duplicate sequence value: ${lesson.sequence}`,
      );
    }
    sequences.add(lesson.sequence);

    if (lesson.lessonNumber === 0) {
      lessonNumberZeroCount += 1;
    }

    const readmeFiles = lesson.files.filter((file) => file.role === "readme");
    if (readmeFiles.length !== 1) {
      throw new CurriculumIntegrityError(
        `Lesson ${lesson.id} must have exactly one README descriptor`,
      );
    }

    const primaryFiles = lesson.files.filter((file) => file.role === "primary");
    if (primaryFiles.length < 1) {
      throw new CurriculumIntegrityError(
        `Lesson ${lesson.id} must have at least one primary file`,
      );
    }

    const fileIds = new Set<string>();
    for (const file of lesson.files) {
      if (fileIds.has(file.id)) {
        throw new CurriculumIntegrityError(
          `Duplicate file id in lesson ${lesson.id}: ${file.id}`,
        );
      }
      fileIds.add(file.id);

      if (file.role === "solution" && file.name !== "solution.c") {
        throw new CurriculumIntegrityError(
          `Solution file for lesson ${lesson.id} must be solution.c`,
        );
      }

      const absolutePath = path.resolve(repositoryRoot, file.relativePath);
      const lessonDirectory = path.resolve(repositoryRoot, lesson.directory);

      assertPathContained(
        absolutePath,
        repositoryRoot,
        `Manifest path for ${lesson.id}/${file.id}`,
      );
      assertPathContained(
        absolutePath,
        lessonDirectory,
        `Manifest path for ${lesson.id}/${file.id}`,
      );

      try {
        await access(absolutePath);
      } catch {
        throw new CurriculumIntegrityError(
          `Declared file does not exist: ${file.relativePath}`,
        );
      }
    }
  }

  if (lessonNumberZeroCount !== 2) {
    throw new CurriculumIntegrityError(
      `Expected exactly two Lesson 0 entries, found ${lessonNumberZeroCount}`,
    );
  }

  const orderedSequences = [...manifest]
    .sort((left, right) => left.sequence - right.sequence)
    .map((lesson) => lesson.sequence);
  const expectedSequences = Array.from({ length: 16 }, (_, index) => index);
  if (orderedSequences.join(",") !== expectedSequences.join(",")) {
    throw new CurriculumIntegrityError(
      "Sequence values must be a deterministic 0..15 ordering",
    );
  }

  const lesson12 = manifest.find(
    (lesson) => lesson.id === "header-files-and-multiple-source-files",
  );
  if (!lesson12) {
    throw new CurriculumIntegrityError("Lesson 12 manifest entry is missing");
  }
  const lesson12Roles = new Set(lesson12.files.map((file) => file.role));
  for (const role of ["readme", "primary", "support", "header", "solution"]) {
    if (!lesson12Roles.has(role as ManifestLessonFileEntry["role"])) {
      throw new CurriculumIntegrityError(
        `Lesson 12 must include role: ${role}`,
      );
    }
  }

  const lesson14 = manifest.find(
    (lesson) => lesson.id === "intermediate-console-project",
  );
  if (!lesson14) {
    throw new CurriculumIntegrityError("Lesson 14 manifest entry is missing");
  }
  if (lesson14.files.length < 9) {
    throw new CurriculumIntegrityError(
      "Lesson 14 must expose its multi-file structure",
    );
  }
  const lesson14Roles = new Set(lesson14.files.map((file) => file.role));
  for (const role of ["readme", "primary", "support", "header", "solution"]) {
    if (!lesson14Roles.has(role as ManifestLessonFileEntry["role"])) {
      throw new CurriculumIntegrityError(
        `Lesson 14 must include role: ${role}`,
      );
    }
  }

  validateCompileMetadata(manifest);
}

const KNOWN_LINK_FLAGS = new Set(["-lm"]);
const COMPILE_SOURCE_ROLES = new Set<ManifestLessonFileEntry["role"]>([
  "primary",
  "support",
]);

function validateCompileMetadata(manifest: ManifestLessonEntry[]): void {
  for (const lesson of manifest) {
    const compile = lesson.compile;
    if (!compile) {
      throw new CurriculumIntegrityError(
        `Lesson ${lesson.id} is missing compile metadata`,
      );
    }

    if (compile.sourceFileIds.length === 0) {
      throw new CurriculumIntegrityError(
        `Lesson ${lesson.id} must declare at least one compile source file`,
      );
    }

    const filesById = new Map(lesson.files.map((file) => [file.id, file]));
    const sourceIds = new Set<string>();

    for (const sourceId of compile.sourceFileIds) {
      if (sourceIds.has(sourceId)) {
        throw new CurriculumIntegrityError(
          `Lesson ${lesson.id} has duplicate compile source id: ${sourceId}`,
        );
      }
      sourceIds.add(sourceId);

      const file = filesById.get(sourceId);
      if (!file) {
        throw new CurriculumIntegrityError(
          `Lesson ${lesson.id} compile source id does not exist: ${sourceId}`,
        );
      }

      if (!COMPILE_SOURCE_ROLES.has(file.role)) {
        throw new CurriculumIntegrityError(
          `Lesson ${lesson.id} compile source ${sourceId} must be primary or support`,
        );
      }

      if (file.role === "readme" || file.role === "solution" || file.role === "header") {
        throw new CurriculumIntegrityError(
          `Lesson ${lesson.id} compile source ${sourceId} has forbidden role ${file.role}`,
        );
      }
    }

    for (const linkFlag of compile.linkFlags) {
      if (!KNOWN_LINK_FLAGS.has(linkFlag)) {
        throw new CurriculumIntegrityError(
          `Lesson ${lesson.id} has unknown link flag: ${linkFlag}`,
        );
      }
    }
  }

  const lesson12 = manifest.find(
    (entry) => entry.id === "header-files-and-multiple-source-files",
  );
  if (lesson12) {
    expectCompileSpec(lesson12, ["primary", "geometry"], ["-lm"]);
  }

  const lesson14Entry = manifest.find(
    (entry) => entry.id === "intermediate-console-project",
  );
  if (lesson14Entry) {
    expectCompileSpec(
      lesson14Entry,
      ["primary", "task", "store", "util"],
      [],
    );
  }
}

function expectCompileSpec(
  lesson: ManifestLessonEntry,
  sourceFileIds: string[],
  linkFlags: string[],
): void {
  if (lesson.compile.sourceFileIds.join(",") !== sourceFileIds.join(",")) {
    throw new CurriculumIntegrityError(
      `Lesson ${lesson.id} compile sourceFileIds mismatch`,
    );
  }
  if (lesson.compile.linkFlags.join(",") !== linkFlags.join(",")) {
    throw new CurriculumIntegrityError(
      `Lesson ${lesson.id} compile linkFlags mismatch`,
    );
  }
}

export function createCurriculumService(
  options: CurriculumServiceOptions,
): CurriculumService {
  const manifest = options.manifest ?? CURRICULUM_MANIFEST;
  const repositoryRoot = path.resolve(options.repositoryRoot);
  const lessonsById = new Map(manifest.map((lesson) => [lesson.id, lesson]));

  return {
    listLessons(): LessonSummary[] {
      return [...manifest]
        .sort((left, right) => left.sequence - right.sequence)
        .map(toLessonSummary);
    },

    getLessonDetail(lessonId: string): LessonDetail {
      const lesson = lessonsById.get(lessonId);
      if (!lesson) {
        throw new LessonNotFoundError(lessonId);
      }

      return {
        ...toLessonSummary(lesson),
        files: lesson.files.map(toFileDescriptor),
      };
    },

    async getLessonFileContent(
      lessonId: string,
      fileId: string,
    ): Promise<LessonFileContent> {
      const lesson = lessonsById.get(lessonId);
      if (!lesson) {
        throw new LessonNotFoundError(lessonId);
      }

      const file = lesson.files.find((entry) => entry.id === fileId);
      if (!file) {
        throw new LessonFileNotFoundError(lessonId, fileId);
      }

      const absolutePath = path.resolve(repositoryRoot, file.relativePath);
      const lessonDirectory = path.resolve(repositoryRoot, lesson.directory);

      assertPathContained(
        absolutePath,
        repositoryRoot,
        `Resolved file for ${lessonId}/${fileId}`,
      );
      assertPathContained(
        absolutePath,
        lessonDirectory,
        `Resolved file for ${lessonId}/${fileId}`,
      );

      let content: string;
      try {
        content = await readFile(absolutePath, "utf8");
      } catch {
        throw new CurriculumIntegrityError(
          `Manifest-declared file is unreadable: ${file.relativePath}`,
        );
      }

      return {
        lessonId,
        file: toFileDescriptor(file),
        content,
      };
    },
  };
}
