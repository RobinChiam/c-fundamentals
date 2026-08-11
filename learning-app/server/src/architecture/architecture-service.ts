import type {
  ArchitectureFile,
  ArchitectureFileKind,
  IncludeEdge,
  IncludeGuard,
  LessonArchitectureResponse,
  TranslationUnit,
} from "@learning-app/shared";
import { lessonArchitectureResponseSchema } from "@learning-app/shared";
import {
  LessonNotFoundError,
  type CurriculumService,
} from "../curriculum/curriculum-service.js";
import { CURRICULUM_MANIFEST, type ManifestLessonEntry } from "../curriculum/manifest.js";
import {
  getArchitectureDefinition,
  SOLUTION_OMITTED_NOTE,
} from "./architecture-definitions.js";
import {
  detectIncludeGuard,
  extractIncludes,
  resolveProjectInclude,
} from "./source-analysis.js";
import { SUPPORTED_ARCHITECTURE_LESSON_IDS } from "@learning-app/shared";

export class ArchitectureNotSupportedError extends Error {
  constructor(lessonId: string) {
    super(`Architecture not supported for lesson: ${lessonId}`);
    this.name = "ArchitectureNotSupportedError";
  }
}

export interface ArchitectureService {
  getLessonArchitecture(lessonId: string): Promise<LessonArchitectureResponse>;
  isSupportedLesson(lessonId: string): boolean;
}

export interface ArchitectureServiceOptions {
  curriculumService: CurriculumService;
  manifest?: ManifestLessonEntry[];
}

function fileKindForRole(
  role: ArchitectureFile["role"],
): ArchitectureFileKind {
  if (role === "header") {
    return "header";
  }
  return "source";
}

function objectFileLabel(sourceFileName: string): string {
  const base = sourceFileName.replace(/\.c$/i, "");
  return `${base}.o`;
}

export function createArchitectureService(
  options: ArchitectureServiceOptions,
): ArchitectureService {
  const manifest = options.manifest ?? CURRICULUM_MANIFEST;
  const lessonsById = new Map(manifest.map((lesson) => [lesson.id, lesson]));

  return {
    isSupportedLesson(lessonId: string): boolean {
      return SUPPORTED_ARCHITECTURE_LESSON_IDS.includes(
        lessonId as (typeof SUPPORTED_ARCHITECTURE_LESSON_IDS)[number],
      );
    },

    async getLessonArchitecture(lessonId: string): Promise<LessonArchitectureResponse> {
      const lesson = lessonsById.get(lessonId);
      if (!lesson) {
        throw new LessonNotFoundError(lessonId);
      }

      const definition = getArchitectureDefinition(lessonId);
      if (!definition) {
        throw new ArchitectureNotSupportedError(lessonId);
      }

      const architectureFiles = lesson.files.filter(
        (file) => file.role !== "readme" && file.role !== "solution",
      );
      const lookup = architectureFiles.map((file) => ({
        id: file.id,
        name: file.name,
      }));

      const includes: IncludeEdge[] = [];
      const includeGuards: IncludeGuard[] = [];

      for (const file of architectureFiles) {
        if (file.language !== "c") {
          continue;
        }

        const content = await options.curriculumService.getLessonFileContent(
          lessonId,
          file.id,
        );

        if (file.role === "header") {
          const guard = detectIncludeGuard(content.content);
          if (guard) {
            includeGuards.push({ fileId: file.id, macro: guard });
          }
        }

        const { projectIncludes } = extractIncludes(content.content);
        for (const includeName of projectIncludes) {
          const resolved = resolveProjectInclude(includeName, lookup);
          if (resolved) {
            includes.push({
              fromFileId: file.id,
              toFileId: resolved.id,
              includeName,
            });
          }
        }
      }

      const translationUnits: TranslationUnit[] = lesson.compile.sourceFileIds.map(
        (sourceFileId) => {
          const sourceFile = architectureFiles.find(
            (file) => file.id === sourceFileId,
          );
          if (!sourceFile) {
            throw new Error(`Missing compile source file ${sourceFileId}`);
          }

          const includedHeaderFileIds = includes
            .filter((edge) => edge.fromFileId === sourceFileId)
            .map((edge) => edge.toFileId)
            .filter((targetId) => {
              const target = architectureFiles.find((file) => file.id === targetId);
              return target?.role === "header";
            });

          return {
            sourceFileId,
            sourceFileName: sourceFile.name,
            includedHeaderFileIds,
            objectFileLabel: objectFileLabel(sourceFile.name),
          };
        },
      );

      const files: ArchitectureFile[] = architectureFiles.map((file) => ({
        fileId: file.id,
        name: file.name,
        role: file.role,
        kind: fileKindForRole(file.role),
        responsibility: definition.fileResponsibilities[file.id],
      }));

      const response: LessonArchitectureResponse = {
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        isCapstone: definition.isCapstone,
        files,
        includes,
        includeGuards,
        modules: definition.modules.map((module) => ({
          ...module,
          publicConcepts: module.publicConcepts,
        })),
        ownership: definition.ownership,
        resources: definition.resources,
        build: {
          sourceFileIds: [...lesson.compile.sourceFileIds],
          translationUnits,
          linkFlags: [...lesson.compile.linkFlags],
          outputLabel: definition.outputLabel,
        },
        buildPipelineStages: definition.buildPipelineStages,
        buildMistakes: definition.buildMistakes,
        workflows: definition.workflows,
        solutionOmittedNote: SOLUTION_OMITTED_NOTE,
      };

      return lessonArchitectureResponseSchema.parse(response);
    },
  };
}
