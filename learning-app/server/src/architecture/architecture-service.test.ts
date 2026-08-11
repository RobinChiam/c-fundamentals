import { afterAll, describe, expect, it } from "vitest";
import { lessonArchitectureResponseSchema } from "@learning-app/shared";
import { buildApp } from "../app.js";
import { createArchitectureService } from "./architecture-service.js";
import { createCurriculumService } from "../curriculum/curriculum-service.js";
import { resolveDefaultRepositoryRoot } from "../curriculum/repository-root.js";

describe("architecture service", () => {
  const repositoryRoot = resolveDefaultRepositoryRoot();
  const curriculumService = createCurriculumService({ repositoryRoot });
  const service = createArchitectureService({ curriculumService });
  const appPromise = buildApp({
    curriculumService,
    architectureService: service,
    skipPersistence: true,
  });

  afterAll(async () => {
    const app = await appPromise;
    await app.close();
  });

  describe("lesson 12", () => {
    it("represents main.c, geometry.c, and geometry.h", async () => {
      const architecture = await service.getLessonArchitecture(
        "header-files-and-multiple-source-files",
      );
      const names = architecture.files.map((file) => file.name);
      expect(names).toContain("main.c");
      expect(names).toContain("geometry.c");
      expect(names).toContain("geometry.h");
    });

    it("omits solution.c", async () => {
      const architecture = await service.getLessonArchitecture(
        "header-files-and-multiple-source-files",
      );
      expect(architecture.files.some((file) => file.name === "solution.c")).toBe(
        false,
      );
    });

    it("shows geometry.h as public contract", async () => {
      const architecture = await service.getLessonArchitecture(
        "header-files-and-multiple-source-files",
      );
      const header = architecture.files.find((file) => file.name === "geometry.h");
      expect(header?.role).toBe("header");
      expect(header?.responsibility).toMatch(/public contract/i);
    });

    it("does not represent header as independent object file", async () => {
      const architecture = await service.getLessonArchitecture(
        "header-files-and-multiple-source-files",
      );
      const objectLabels = architecture.build.translationUnits.map(
        (unit) => unit.objectFileLabel,
      );
      expect(objectLabels).toEqual(["main.o", "geometry.o"]);
      expect(objectLabels.some((label) => label.includes("geometry.h"))).toBe(false);
    });

    it("main translation unit includes project header", async () => {
      const architecture = await service.getLessonArchitecture(
        "header-files-and-multiple-source-files",
      );
      const mainUnit = architecture.build.translationUnits.find(
        (unit) => unit.sourceFileName === "main.c",
      );
      expect(mainUnit?.includedHeaderFileIds).toContain("geometry-header");
    });

    it("geometry translation unit includes project header", async () => {
      const architecture = await service.getLessonArchitecture(
        "header-files-and-multiple-source-files",
      );
      const geometryUnit = architecture.build.translationUnits.find(
        (unit) => unit.sourceFileName === "geometry.c",
      );
      expect(geometryUnit?.includedHeaderFileIds).toContain("geometry-header");
    });

    it("represents conceptual main.o and geometry.o", async () => {
      const architecture = await service.getLessonArchitecture(
        "header-files-and-multiple-source-files",
      );
      expect(architecture.build.translationUnits.map((u) => u.objectFileLabel)).toEqual(
        ["main.o", "geometry.o"],
      );
    });

    it("represents -lm from trusted build spec", async () => {
      const architecture = await service.getLessonArchitecture(
        "header-files-and-multiple-source-files",
      );
      expect(architecture.build.linkFlags).toEqual(["-lm"]);
    });

    it("represents link step in pipeline", async () => {
      const architecture = await service.getLessonArchitecture(
        "header-files-and-multiple-source-files",
      );
      expect(architecture.buildPipelineStages.some((stage) => /link/i.test(stage.label))).toBe(
        true,
      );
    });

    it("shows include guard", async () => {
      const architecture = await service.getLessonArchitecture(
        "header-files-and-multiple-source-files",
      );
      expect(architecture.includeGuards).toContainEqual({
        fileId: "geometry-header",
        macro: "GEOMETRY_H",
      });
    });

    it("explains missing geometry implementation mistake", async () => {
      const architecture = await service.getLessonArchitecture(
        "header-files-and-multiple-source-files",
      );
      expect(
        architecture.buildMistakes?.some((mistake) => mistake.id === "omit-geometry-c"),
      ).toBe(true);
    });
  });

  describe("capstone", () => {
    it("represents main, task, store, and util modules", async () => {
      const architecture = await service.getLessonArchitecture(
        "intermediate-console-project",
      );
      const moduleIds = architecture.modules.map((module) => module.id);
      expect(moduleIds).toEqual(["main", "task", "store", "util"]);
    });

    it("represents all expected non-solution files", async () => {
      const architecture = await service.getLessonArchitecture(
        "intermediate-console-project",
      );
      expect(architecture.files).toHaveLength(7);
    });

    it("omits solution from architecture response", async () => {
      const architecture = await service.getLessonArchitecture(
        "intermediate-console-project",
      );
      expect(architecture.files.some((file) => file.role === "solution")).toBe(false);
    });

    it("represents actual project include graph", async () => {
      const architecture = await service.getLessonArchitecture(
        "intermediate-console-project",
      );
      expect(architecture.includes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fromFileId: "primary",
            toFileId: "store-header",
            includeName: "store.h",
          }),
          expect.objectContaining({
            fromFileId: "primary",
            toFileId: "util-header",
            includeName: "util.h",
          }),
          expect.objectContaining({
            fromFileId: "store-header",
            toFileId: "task-header",
            includeName: "task.h",
          }),
        ]),
      );
    });

    it("shows public APIs", async () => {
      const architecture = await service.getLessonArchitecture(
        "intermediate-console-project",
      );
      const storeModule = architecture.modules.find((module) => module.id === "store");
      expect(storeModule?.publicConcepts).toContain("TaskStore");
      expect(storeModule?.publicConcepts).toContain("store_add");
    });

    it("shows TaskStore ownership", async () => {
      const architecture = await service.getLessonArchitecture(
        "intermediate-console-project",
      );
      expect(architecture.ownership[0]?.ownerModuleId).toBe("store");
      expect(architecture.ownership[0]?.label).toMatch(/TaskStore/i);
    });

    it("represents items/count/capacity concepts", async () => {
      const architecture = await service.getLessonArchitecture(
        "intermediate-console-project",
      );
      expect(architecture.ownership[0]?.description).toMatch(/count/);
      expect(architecture.ownership[0]?.description).toMatch(/capacity/);
      expect(architecture.ownership[0]?.description).toMatch(/next_id/);
    });

    it("shows tasks.txt as persistence resource", async () => {
      const architecture = await service.getLessonArchitecture(
        "intermediate-console-project",
      );
      expect(architecture.resources).toContainEqual(
        expect.objectContaining({ id: "tasks-txt", label: "tasks.txt" }),
      );
    });

    it("shows trusted compile source set", async () => {
      const architecture = await service.getLessonArchitecture(
        "intermediate-console-project",
      );
      expect(architecture.build.sourceFileIds).toEqual([
        "primary",
        "task",
        "store",
        "util",
      ]);
    });

    it("headers are not linked independently", async () => {
      const architecture = await service.getLessonArchitecture(
        "intermediate-console-project",
      );
      const objectFiles = architecture.build.translationUnits.map(
        (unit) => unit.objectFileLabel,
      );
      expect(objectFiles.every((label) => label.endsWith(".o"))).toBe(true);
      expect(objectFiles.some((label) => label.endsWith(".h.o"))).toBe(false);
    });

    it("shows executable link stage", async () => {
      const architecture = await service.getLessonArchitecture(
        "intermediate-console-project",
      );
      expect(architecture.build.outputLabel).toBe("task_tracker.exe");
      expect(
        architecture.buildPipelineStages.some((stage) => /executable/i.test(stage.label)),
      ).toBe(true);
    });
  });

  describe("workflows", () => {
    it("includes Add, Save, Load, and Sort workflows", async () => {
      const architecture = await service.getLessonArchitecture(
        "intermediate-console-project",
      );
      const workflowIds = architecture.workflows.map((workflow) => workflow.id);
      expect(workflowIds).toEqual([
        "add-task",
        "save-tasks",
        "load-tasks",
        "sort-by-priority",
      ]);
    });

    it("Add Task module order aligns with source collaboration", async () => {
      const architecture = await service.getLessonArchitecture(
        "intermediate-console-project",
      );
      const addWorkflow = architecture.workflows.find(
        (workflow) => workflow.id === "add-task",
      );
      expect(addWorkflow?.steps.map((step) => step.moduleId)).toEqual([
        "main",
        "util",
        "task",
        "task",
        "store",
        "store",
      ]);
    });

    it("Save workflow reaches tasks.txt resource", async () => {
      const architecture = await service.getLessonArchitecture(
        "intermediate-console-project",
      );
      const saveWorkflow = architecture.workflows.find(
        (workflow) => workflow.id === "save-tasks",
      );
      expect(saveWorkflow?.steps.some((step) => step.resourceId === "tasks-txt")).toBe(
        true,
      );
    });

    it("Load workflow starts from tasks.txt resource", async () => {
      const architecture = await service.getLessonArchitecture(
        "intermediate-console-project",
      );
      const loadWorkflow = architecture.workflows.find(
        (workflow) => workflow.id === "load-tasks",
      );
      expect(loadWorkflow?.steps[0]?.resourceId).toBe("tasks-txt");
    });

    it("Sort workflow emphasizes module collaboration", async () => {
      const architecture = await service.getLessonArchitecture(
        "intermediate-console-project",
      );
      const sortWorkflow = architecture.workflows.find(
        (workflow) => workflow.id === "sort-by-priority",
      );
      expect(sortWorkflow?.moduleCollaborationNote).toMatch(/module collaboration/i);
      expect(sortWorkflow?.moduleCollaborationNote).toMatch(/Part 9/i);
    });

    it("workflows do not claim actual runtime tracing", async () => {
      const architecture = await service.getLessonArchitecture(
        "intermediate-console-project",
      );
      for (const workflow of architecture.workflows) {
        expect(workflow.moduleCollaborationNote).toMatch(/not/i);
      }
    });
  });

  describe("routes", () => {
    it("lesson 12 architecture endpoint works", async () => {
      const app = await appPromise;
      const response = await app.inject({
        method: "GET",
        url: "/api/lessons/header-files-and-multiple-source-files/architecture",
      });
      expect(response.statusCode).toBe(200);
      lessonArchitectureResponseSchema.parse(JSON.parse(response.body));
    });

    it("capstone architecture endpoint works", async () => {
      const app = await appPromise;
      const response = await app.inject({
        method: "GET",
        url: "/api/lessons/intermediate-console-project/architecture",
      });
      expect(response.statusCode).toBe(200);
      lessonArchitectureResponseSchema.parse(JSON.parse(response.body));
    });

    it("unknown lesson returns 404", async () => {
      const app = await appPromise;
      const response = await app.inject({
        method: "GET",
        url: "/api/lessons/unknown-lesson/architecture",
      });
      expect(response.statusCode).toBe(404);
    });

    it("unsupported lesson returns 404 architecture-not-supported", async () => {
      const app = await appPromise;
      const response = await app.inject({
        method: "GET",
        url: "/api/lessons/arrays/architecture",
      });
      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toEqual({
        error: "Architecture not supported for this lesson",
      });
    });

    it("response validates shared schema and omits absolute paths", async () => {
      const architecture = await service.getLessonArchitecture(
        "header-files-and-multiple-source-files",
      );
      const serialized = JSON.stringify(architecture);
      expect(serialized).not.toMatch(/\/home\//);
      expect(serialized).not.toMatch(/Header Files and Multiple Source Files\//);
      expect(serialized).not.toMatch(/Intermediate Console Project\//);
      lessonArchitectureResponseSchema.parse(architecture);
    });

    it("no solution source in architecture response", async () => {
      const architecture = await service.getLessonArchitecture(
        "intermediate-console-project",
      );
      expect(JSON.stringify(architecture)).not.toContain("solution.c");
    });
  });
});
