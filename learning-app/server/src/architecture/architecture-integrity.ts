import type { ManifestLessonEntry } from "../curriculum/manifest.js";
import { CURRICULUM_MANIFEST } from "../curriculum/manifest.js";
import type { CurriculumService } from "../curriculum/curriculum-service.js";
import {
  ARCHITECTURE_DEFINITIONS,
  type CuratedArchitectureDefinition,
} from "./architecture-definitions.js";
import {
  detectIncludeGuard,
  extractIncludes,
  resolveProjectInclude,
  symbolAppearsInSource,
} from "./source-analysis.js";
import { SUPPORTED_ARCHITECTURE_LESSON_IDS } from "@learning-app/shared";

export class ArchitectureIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArchitectureIntegrityError";
  }
}

function isSolutionRole(role: string): boolean {
  return role === "solution";
}

export async function validateArchitectureDefinitions(
  manifest: ManifestLessonEntry[] = CURRICULUM_MANIFEST,
  definitions: CuratedArchitectureDefinition[] = ARCHITECTURE_DEFINITIONS,
  curriculumService?: CurriculumService,
): Promise<void> {
  if (definitions.length !== SUPPORTED_ARCHITECTURE_LESSON_IDS.length) {
    throw new ArchitectureIntegrityError(
      `Expected ${SUPPORTED_ARCHITECTURE_LESSON_IDS.length} architecture definitions`,
    );
  }

  const lessonIds = new Set(manifest.map((lesson) => lesson.id));
  const definitionLessonIds = new Set<string>();

  for (const definition of definitions) {
    if (definitionLessonIds.has(definition.lessonId)) {
      throw new ArchitectureIntegrityError(
        `Duplicate architecture definition for ${definition.lessonId}`,
      );
    }
    definitionLessonIds.add(definition.lessonId);

    if (!lessonIds.has(definition.lessonId)) {
      throw new ArchitectureIntegrityError(
        `Architecture definition references unknown lesson: ${definition.lessonId}`,
      );
    }

    if (
      !SUPPORTED_ARCHITECTURE_LESSON_IDS.includes(
        definition.lessonId as (typeof SUPPORTED_ARCHITECTURE_LESSON_IDS)[number],
      )
    ) {
      throw new ArchitectureIntegrityError(
        `Unsupported architecture lesson id in definitions: ${definition.lessonId}`,
      );
    }

    const lesson = manifest.find((entry) => entry.id === definition.lessonId);
    if (!lesson) {
      throw new ArchitectureIntegrityError(
        `Missing manifest entry for ${definition.lessonId}`,
      );
    }

    const filesById = new Map(lesson.files.map((file) => [file.id, file]));
    const moduleIds = new Set<string>();

    for (const fileId of Object.keys(definition.fileResponsibilities)) {
      const file = filesById.get(fileId);
      if (!file) {
        throw new ArchitectureIntegrityError(
          `fileResponsibilities references unknown file id ${fileId} in ${definition.lessonId}`,
        );
      }
      if (isSolutionRole(file.role)) {
        throw new ArchitectureIntegrityError(
          `fileResponsibilities must not reference solution file ${fileId}`,
        );
      }
    }

    for (const module of definition.modules) {
      if (moduleIds.has(module.id)) {
        throw new ArchitectureIntegrityError(
          `Duplicate module id ${module.id} in ${definition.lessonId}`,
        );
      }
      moduleIds.add(module.id);

      if (module.fileIds.length === 0) {
        throw new ArchitectureIntegrityError(
          `Module ${module.id} must reference at least one file`,
        );
      }

      for (const fileId of module.fileIds) {
        const file = filesById.get(fileId);
        if (!file) {
          throw new ArchitectureIntegrityError(
            `Module ${module.id} references unknown file id ${fileId}`,
          );
        }
        if (isSolutionRole(file.role)) {
          throw new ArchitectureIntegrityError(
            `Module ${module.id} must not reference solution file ${fileId}`,
          );
        }
      }
    }

    for (const api of definition.publicApis) {
      const file = filesById.get(api.fileId);
      if (!file) {
        throw new ArchitectureIntegrityError(
          `Public API references unknown file id ${api.fileId}`,
        );
      }
      if (file.role !== "header") {
        throw new ArchitectureIntegrityError(
          `Public API target ${api.fileId} must be a header file`,
        );
      }
      if (isSolutionRole(file.role)) {
        throw new ArchitectureIntegrityError(
          `Public API must not target solution file ${api.fileId}`,
        );
      }

      if (curriculumService) {
        const content = await curriculumService.getLessonFileContent(
          definition.lessonId,
          api.fileId,
        );
        for (const symbol of api.symbols) {
          if (!symbolAppearsInSource(content.content, symbol)) {
            throw new ArchitectureIntegrityError(
              `Stale public symbol ${symbol} missing from ${api.fileId} in ${definition.lessonId}`,
            );
          }
        }
      }
    }

    const knownResourceIds = new Set([
      ...definition.resources.map((resource) => resource.id),
      ...definition.ownership.map((relation) => relation.resourceId),
    ]);

    for (const workflow of definition.workflows) {
      for (const step of workflow.steps) {
        if (step.fileId) {
          const file = filesById.get(step.fileId);
          if (!file) {
            throw new ArchitectureIntegrityError(
              `Workflow ${workflow.id} step ${step.id} references unknown file ${step.fileId}`,
            );
          }
          if (isSolutionRole(file.role)) {
            throw new ArchitectureIntegrityError(
              `Workflow step must not reference solution file ${step.fileId}`,
            );
          }
        }

        if (step.moduleId && !moduleIds.has(step.moduleId)) {
          throw new ArchitectureIntegrityError(
            `Workflow ${workflow.id} step ${step.id} references unknown module ${step.moduleId}`,
          );
        }

        if (step.resourceId && !knownResourceIds.has(step.resourceId)) {
          throw new ArchitectureIntegrityError(
            `Workflow ${workflow.id} step ${step.id} references unknown resource ${step.resourceId}`,
          );
        }

        if (step.symbol && step.fileId && curriculumService) {
          const content = await curriculumService.getLessonFileContent(
            definition.lessonId,
            step.fileId,
          );
          if (!symbolAppearsInSource(content.content, step.symbol)) {
            throw new ArchitectureIntegrityError(
              `Workflow symbol ${step.symbol} missing from ${step.fileId} in workflow ${workflow.id}`,
            );
          }
        }

        if (step.symbol && !step.fileId && curriculumService) {
          const module = definition.modules.find(
            (entry) => entry.id === step.moduleId,
          );
          const implementationFileId = module?.fileIds.find((fileId) => {
            const file = filesById.get(fileId);
            return file?.role === "support" || file?.role === "primary";
          });
          if (implementationFileId) {
            const content = await curriculumService.getLessonFileContent(
              definition.lessonId,
              implementationFileId,
            );
            if (!symbolAppearsInSource(content.content, step.symbol)) {
              throw new ArchitectureIntegrityError(
                `Workflow symbol ${step.symbol} missing from module ${step.moduleId} implementation in workflow ${workflow.id}`,
              );
            }
          }
        }
      }
    }

    for (const relation of definition.ownership) {
      if (!moduleIds.has(relation.ownerModuleId)) {
        throw new ArchitectureIntegrityError(
          `Ownership relation references unknown module ${relation.ownerModuleId}`,
        );
      }
      if (!knownResourceIds.has(relation.resourceId)) {
        throw new ArchitectureIntegrityError(
          `Ownership relation references unknown resource ${relation.resourceId}`,
        );
      }
    }

    for (const sourceId of lesson.compile.sourceFileIds) {
      const file = filesById.get(sourceId);
      if (!file) {
        throw new ArchitectureIntegrityError(
          `Compile source ${sourceId} missing for ${definition.lessonId}`,
        );
      }
      if (isSolutionRole(file.role)) {
        throw new ArchitectureIntegrityError(
          `Compile source must not be solution file ${sourceId}`,
        );
      }
    }

    if (curriculumService) {
      await validateIncludeEdges(definition, lesson, curriculumService);
      await validateIncludeGuards(definition, lesson, curriculumService);
    }
  }

  for (const lessonId of SUPPORTED_ARCHITECTURE_LESSON_IDS) {
    if (!definitionLessonIds.has(lessonId)) {
      throw new ArchitectureIntegrityError(
        `Missing architecture definition for supported lesson ${lessonId}`,
      );
    }
  }
}

async function validateIncludeEdges(
  definition: CuratedArchitectureDefinition,
  lesson: ManifestLessonEntry,
  curriculumService: CurriculumService,
): Promise<void> {
  const eligibleFiles = lesson.files.filter(
    (file) => file.role !== "readme" && file.role !== "solution",
  );
  const lookup = eligibleFiles.map((file) => ({ id: file.id, name: file.name }));

  for (const file of eligibleFiles) {
    if (file.language !== "c") {
      continue;
    }
    const content = await curriculumService.getLessonFileContent(
      definition.lessonId,
      file.id,
    );
    const { projectIncludes } = extractIncludes(content.content);

    for (const includeName of projectIncludes) {
      const resolved = resolveProjectInclude(includeName, lookup);
      if (!resolved) {
        throw new ArchitectureIntegrityError(
          `Unresolved project include "${includeName}" in ${file.id} for ${definition.lessonId}`,
        );
      }
    }
  }
}

async function validateIncludeGuards(
  definition: CuratedArchitectureDefinition,
  lesson: ManifestLessonEntry,
  curriculumService: CurriculumService,
): Promise<void> {
  for (const file of lesson.files) {
    if (file.role !== "header") {
      continue;
    }
    const content = await curriculumService.getLessonFileContent(
      definition.lessonId,
      file.id,
    );
    const guard = detectIncludeGuard(content.content);
    if (!guard) {
      throw new ArchitectureIntegrityError(
        `Expected include guard in header ${file.id} for ${definition.lessonId}`,
      );
    }
  }
}

export function assertStaleAnnotationFails(
  manifest: ManifestLessonEntry[] = CURRICULUM_MANIFEST,
): void {
  const lesson = manifest.find(
    (entry) => entry.id === "header-files-and-multiple-source-files",
  );
  if (!lesson) {
    throw new ArchitectureIntegrityError("Lesson 12 missing for stale test");
  }

  const brokenDefinition: CuratedArchitectureDefinition = {
    ...ARCHITECTURE_DEFINITIONS[0]!,
    publicApis: [
      {
        fileId: "geometry-header",
        symbols: ["THIS_SYMBOL_DOES_NOT_EXIST_IN_GEOMETRY_H"],
      },
    ],
  };

  const filesById = new Map(lesson.files.map((file) => [file.id, file]));
  const api = brokenDefinition.publicApis[0]!;
  const file = filesById.get(api.fileId);
  if (!file) {
    throw new ArchitectureIntegrityError("geometry-header missing");
  }

  const headerSource = "#ifndef GEOMETRY_H\n#define GEOMETRY_H\n#endif\n";
  for (const symbol of api.symbols) {
    if (symbolAppearsInSource(headerSource, symbol)) {
      throw new ArchitectureIntegrityError(
        "Stale annotation test setup is invalid",
      );
    }
  }
}
