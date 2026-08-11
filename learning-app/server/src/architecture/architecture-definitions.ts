import type {
  ArchitectureWorkflow,
  BuildMistake,
  BuildPipelineStage,
  ModuleAnnotation,
  OwnershipRelation,
  ArchitectureResource,
} from "@learning-app/shared";
import type { SupportedArchitectureLessonId } from "@learning-app/shared";

export interface CuratedPublicApiEntry {
  fileId: string;
  symbols: string[];
}

export interface CuratedArchitectureDefinition {
  lessonId: SupportedArchitectureLessonId;
  isCapstone: boolean;
  modules: ModuleAnnotation[];
  ownership: OwnershipRelation[];
  resources: ArchitectureResource[];
  publicApis: CuratedPublicApiEntry[];
  fileResponsibilities: Record<string, string>;
  buildMistakes?: BuildMistake[];
  workflows: ArchitectureWorkflow[];
  buildPipelineStages: BuildPipelineStage[];
  outputLabel: string;
}

const SOLUTION_OMITTED_NOTE =
  "Reference solution is an alternate entry point and is intentionally omitted from this architecture view.";

export { SOLUTION_OMITTED_NOTE };

const LESSON12_BUILD_PIPELINE: BuildPipelineStage[] = [
  {
    id: "sources",
    label: "Project sources identified",
    narration:
      "The build starts with the curriculum translation units: main.c and geometry.c.",
    highlights: ["primary", "geometry"],
  },
  {
    id: "includes",
    label: "Headers included into translation units",
    narration:
      "Each .c file pulls in geometry.h through #include. Headers are textually inserted; they are not compiled on their own.",
    highlights: ["geometry-header"],
  },
  {
    id: "compile-main",
    label: "main.c compiled to main.o",
    narration:
      "main.c plus included geometry.h forms one translation unit that compiles to a conceptual main.o object file.",
    highlights: ["primary", "geometry-header"],
  },
  {
    id: "compile-geometry",
    label: "geometry.c compiled to geometry.o",
    narration:
      "geometry.c plus included geometry.h forms a separate translation unit that compiles to geometry.o.",
    highlights: ["geometry", "geometry-header"],
  },
  {
    id: "collect",
    label: "Object files collected",
    narration:
      "The linker receives main.o and geometry.o. geometry.h does not become its own object file.",
    highlights: ["primary", "geometry"],
  },
  {
    id: "link-flag",
    label: "External library flag applied",
    narration:
      "The trusted build spec adds -lm so sqrt and other math helpers from geometry.c link against libm.",
    highlights: ["-lm"],
  },
  {
    id: "link",
    label: "Linker produces executable",
    narration:
      "main.o, geometry.o, and -lm are combined into the geometry demo executable.",
    highlights: ["geometry_demo.exe"],
  },
];

const LESSON12_BUILD_MISTAKES: BuildMistake[] = [
  {
    id: "omit-geometry-c",
    title: "geometry.c omitted from the link",
    description:
      "Compiling only main.c succeeds initially, but the linker reports undefined references to rect_area, circle_area, and point_distance because geometry.o was never produced.",
    category: "link",
  },
  {
    id: "header-implementation",
    title: "Function bodies placed in geometry.h",
    description:
      "Putting implementations in a header included by multiple .c files causes duplicate symbol definitions at link time.",
    category: "link",
  },
  {
    id: "missing-guard",
    title: "Missing include guard",
    description:
      "Without #ifndef GEOMETRY_H / #define GEOMETRY_H, accidental double inclusion can redeclare types and functions, leading to compile errors.",
    category: "preprocessor",
  },
  {
    id: "duplicate-main",
    title: "Duplicate main in geometry.c",
    description:
      "Each executable needs exactly one main. Adding main to geometry.c creates multiple entry points and fails at link time.",
    category: "link",
  },
  {
    id: "decl-def-mismatch",
    title: "Declaration/definition mismatch",
    description:
      "If geometry.h declares a function with a different signature than geometry.c defines, the compiler or linker reports a type or symbol mismatch.",
    category: "compile",
  },
];

const CAPSTONE_BUILD_PIPELINE: BuildPipelineStage[] = [
  {
    id: "sources",
    label: "Project sources identified",
    narration:
      "The capstone build compiles main.c, task.c, store.c, and util.c as separate translation units.",
    highlights: ["primary", "task", "store", "util"],
  },
  {
    id: "includes",
    label: "Headers included into translation units",
    narration:
      "Headers such as store.h and task.h are pulled into .c files through #include. They participate through inclusion, not as standalone object files.",
    highlights: ["store-header", "task-header", "util-header"],
  },
  {
    id: "compile-units",
    label: "Each .c compiled to an object file",
    narration:
      "Every .c file plus its included headers becomes one translation unit and a conceptual .o file (main.o, task.o, store.o, util.o).",
    highlights: ["primary", "task", "store", "util"],
  },
  {
    id: "collect",
    label: "Object files collected",
    narration:
      "All object files are handed to the linker. Header files are not linked independently.",
    highlights: ["primary", "task", "store", "util"],
  },
  {
    id: "link",
    label: "Linker produces executable",
    narration:
      "The linker combines the object files into the task tracker executable.",
    highlights: ["task_tracker.exe"],
  },
];

export const ARCHITECTURE_DEFINITIONS: CuratedArchitectureDefinition[] = [
  {
    lessonId: "header-files-and-multiple-source-files",
    isCapstone: false,
    modules: [
      {
        id: "main",
        label: "main.c",
        fileIds: ["primary"],
        responsibility: "Program entry point, user interaction, and demo orchestration.",
        publicConcepts: ["main"],
      },
      {
        id: "geometry",
        label: "geometry module",
        fileIds: ["geometry", "geometry-header"],
        responsibility:
          "Reusable geometry types and math helpers with a public header contract.",
        publicConcepts: [
          "Rect",
          "Circle",
          "rect_area",
          "rect_perimeter",
          "circle_area",
          "circle_circumference",
          "point_distance",
        ],
      },
    ],
    ownership: [],
    resources: [],
    publicApis: [
      {
        fileId: "geometry-header",
        symbols: [
          "Rect",
          "Circle",
          "rect_area",
          "rect_perimeter",
          "circle_area",
          "circle_circumference",
          "point_distance",
        ],
      },
    ],
    fileResponsibilities: {
      primary: "Entry point and user-facing demo loop.",
      geometry: "Implementation of geometry helpers declared in geometry.h.",
      "geometry-header": "Public contract: types and function prototypes.",
    },
    buildMistakes: LESSON12_BUILD_MISTAKES,
    workflows: [],
    buildPipelineStages: LESSON12_BUILD_PIPELINE,
    outputLabel: "geometry_demo.exe",
  },
  {
    lessonId: "intermediate-console-project",
    isCapstone: true,
    modules: [
      {
        id: "main",
        label: "MAIN",
        fileIds: ["primary"],
        responsibility: "Menu loop, user actions, and orchestration across modules.",
        publicConcepts: ["main"],
      },
      {
        id: "task",
        label: "TASK",
        fileIds: ["task", "task-header"],
        responsibility:
          "Task domain type, status/priority enums, validation/construction, compare and parse helpers.",
        publicConcepts: [
          "Task",
          "TaskStatus",
          "TaskPriority",
          "task_make",
          "task_compare_priority_desc",
          "task_parse_status",
          "task_parse_priority",
        ],
      },
      {
        id: "store",
        label: "STORE",
        fileIds: ["store", "store-header"],
        responsibility:
          "TaskStore growable collection, add/remove/find, sort, save/load, and cleanup.",
        publicConcepts: [
          "TaskStore",
          "store_add",
          "store_remove_by_id",
          "store_find_by_id",
          "store_sort_by_priority",
          "store_save",
          "store_load",
          "store_free",
        ],
      },
      {
        id: "util",
        label: "UTIL",
        fileIds: ["util", "util-header"],
        responsibility: "Safe line input, numeric/range parsing, and pause helper.",
        publicConcepts: [
          "util_read_line",
          "util_parse_long_range",
          "util_pause_at_exit",
        ],
      },
    ],
    ownership: [
      {
        ownerModuleId: "store",
        resourceId: "taskstore-items",
        label: "TaskStore.items heap array",
        description:
          "The store module owns the heap-backed Task array (items). count tracks live elements; capacity tracks allocated slots; next_id assigns ids. store_free releases the allocation; callers must not free individual Task elements or keep long-lived pointers across realloc growth.",
      },
    ],
    resources: [
      {
        id: "tasks-txt",
        label: "tasks.txt",
        description:
          "Persistence file written at runtime. It is not compiled into the executable.",
        format: "id|status|priority|title",
      },
    ],
    publicApis: [
      {
        fileId: "task-header",
        symbols: [
          "Task",
          "TaskStatus",
          "TaskPriority",
          "task_make",
          "task_compare_priority_desc",
          "task_compare_id_asc",
          "task_status_name",
          "task_priority_name",
          "task_parse_status",
          "task_parse_priority",
        ],
      },
      {
        fileId: "store-header",
        symbols: [
          "TaskStore",
          "store_init",
          "store_free",
          "store_add",
          "store_remove_by_id",
          "store_find_by_id",
          "store_find_title_contains",
          "store_sort_by_priority",
          "store_sort_by_id",
          "store_print_all",
          "store_save",
          "store_load",
        ],
      },
      {
        fileId: "util-header",
        symbols: [
          "util_read_line",
          "util_parse_long_range",
          "util_pause_at_exit",
        ],
      },
    ],
    fileResponsibilities: {
      primary: "Menu loop and user action orchestration.",
      task: "Task record helpers and parsing/comparison logic.",
      "task-header": "Task type, enums, and helper prototypes.",
      store: "Dynamic TaskStore collection and file persistence.",
      "store-header": "TaskStore type and store operation prototypes.",
      util: "Shared input and parsing helpers.",
      "util-header": "Util helper prototypes.",
    },
    workflows: [
      {
        id: "add-task",
        title: "Add Task",
        moduleCollaborationNote:
          "This trace shows module collaboration, not a live execution of your program.",
        steps: [
          {
            id: "add-1",
            label: "User selects Add task",
            moduleId: "main",
            fileId: "primary",
            narration: "main presents the menu and handles the add action.",
          },
          {
            id: "add-2",
            label: "Read and parse input",
            moduleId: "util",
            fileId: "util-header",
            symbol: "util_read_line",
            narration: "util_read_line collects title, status, and priority text.",
          },
          {
            id: "add-3",
            label: "Parse status and priority",
            moduleId: "task",
            fileId: "task-header",
            symbol: "task_parse_status",
            narration:
              "task_parse_status and task_parse_priority convert user text into enums.",
          },
          {
            id: "add-4",
            label: "Validate and construct Task",
            moduleId: "task",
            fileId: "task",
            symbol: "task_make",
            narration: "task_make validates the title and fills a Task record.",
          },
          {
            id: "add-5",
            label: "Append to TaskStore",
            moduleId: "store",
            fileId: "store",
            symbol: "store_add",
            narration:
              "store_add may grow the owned items array through realloc before copying the new Task.",
          },
          {
            id: "add-6",
            label: "Collection updated",
            moduleId: "store",
            resourceId: "taskstore-items",
            narration:
              "TaskStore count increases; the store module retains ownership of the heap-backed array.",
          },
        ],
      },
      {
        id: "save-tasks",
        title: "Save Tasks",
        moduleCollaborationNote:
          "This trace shows module collaboration, not a live execution of your program.",
        steps: [
          {
            id: "save-1",
            label: "User selects Save",
            moduleId: "main",
            fileId: "primary",
            narration: "main triggers persistence through the store module.",
          },
          {
            id: "save-2",
            label: "Serialize TaskStore",
            moduleId: "store",
            fileId: "store",
            symbol: "store_save",
            narration: "store_save walks in-memory Task records and writes text lines.",
          },
          {
            id: "save-3",
            label: "Write tasks.txt",
            resourceId: "tasks-txt",
            narration:
              "Records are written to tasks.txt using id|status|priority|title. The file is a runtime resource, not a compile input.",
          },
        ],
      },
      {
        id: "load-tasks",
        title: "Load Tasks",
        moduleCollaborationNote:
          "This trace shows module collaboration, not a live execution of your program.",
        steps: [
          {
            id: "load-1",
            label: "Read tasks.txt",
            resourceId: "tasks-txt",
            narration: "store_load opens the persistence file at the given path.",
          },
          {
            id: "load-2",
            label: "Parse and validate records",
            moduleId: "store",
            fileId: "store",
            symbol: "store_load",
            narration:
              "Each line is split and validated; invalid records abort the load and reset the store.",
          },
          {
            id: "load-3",
            label: "Construct Task values",
            moduleId: "task",
            fileId: "task",
            symbol: "task_make",
            narration: "task_make builds Task values from parsed fields.",
          },
          {
            id: "load-4",
            label: "Rebuild TaskStore",
            moduleId: "store",
            resourceId: "taskstore-items",
            narration:
              "Loaded tasks replace the in-memory collection according to store_load semantics.",
          },
        ],
      },
      {
        id: "sort-by-priority",
        title: "Sort by Priority",
        moduleCollaborationNote:
          "Focuses on module collaboration — not the insertion-sort algorithm taught in Part 9.",
        steps: [
          {
            id: "sort-1",
            label: "User selects Sort by priority",
            moduleId: "main",
            fileId: "primary",
            narration: "main delegates sorting to the store module.",
          },
          {
            id: "sort-2",
            label: "Sort in place",
            moduleId: "store",
            fileId: "store",
            symbol: "store_sort_by_priority",
            narration: "store_sort_by_priority reorders the owned items array.",
          },
          {
            id: "sort-3",
            label: "Compare tasks",
            moduleId: "task",
            fileId: "task",
            symbol: "task_compare_priority_desc",
            narration:
              "Task comparison helpers determine ordering while modules collaborate.",
          },
          {
            id: "sort-4",
            label: "Updated store order",
            moduleId: "store",
            resourceId: "taskstore-items",
            narration: "TaskStore order reflects the new priority sort.",
          },
        ],
      },
    ],
    buildPipelineStages: CAPSTONE_BUILD_PIPELINE,
    outputLabel: "task_tracker.exe",
  },
];

export function getArchitectureDefinition(
  lessonId: string,
): CuratedArchitectureDefinition | undefined {
  return ARCHITECTURE_DEFINITIONS.find((entry) => entry.lessonId === lessonId);
}
