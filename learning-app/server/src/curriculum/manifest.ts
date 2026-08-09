import type {
  LessonDifficulty,
  LessonFileLanguage,
  LessonFileRole,
} from "@learning-app/shared";

export interface ManifestLessonFileEntry {
  id: string;
  name: string;
  role: LessonFileRole;
  language: LessonFileLanguage;
  relativePath: string;
}

export interface ManifestLessonEntry {
  id: string;
  lessonNumber: number;
  sequence: number;
  title: string;
  difficulty: LessonDifficulty;
  directory: string;
  files: ManifestLessonFileEntry[];
}

function standardLessonFiles(
  directory: string,
  primaryFileName: string,
): ManifestLessonFileEntry[] {
  return [
    {
      id: "readme",
      name: "README.md",
      role: "readme",
      language: "markdown",
      relativePath: `${directory}/README.md`,
    },
    {
      id: "primary",
      name: primaryFileName,
      role: "primary",
      language: "c",
      relativePath: `${directory}/${primaryFileName}`,
    },
    {
      id: "solution",
      name: "solution.c",
      role: "solution",
      language: "c",
      relativePath: `${directory}/solution.c`,
    },
  ];
}

export const CURRICULUM_MANIFEST: ManifestLessonEntry[] = [
  {
    id: "basic-io",
    lessonNumber: 0,
    sequence: 0,
    title: "Basic IO",
    difficulty: "Beginner (starter)",
    directory: "Basic IO",
    files: standardLessonFiles("Basic IO", "main.c"),
  },
  {
    id: "drawing-shapes",
    lessonNumber: 0,
    sequence: 1,
    title: "Drawing Shapes",
    difficulty: "Beginner (starter)",
    directory: "Drawing Shapes",
    files: standardLessonFiles("Drawing Shapes", "shapes.c"),
  },
  {
    id: "variables-and-data-types",
    lessonNumber: 1,
    sequence: 2,
    title: "Variables and Data Types",
    difficulty: "Beginner",
    directory: "Variables and Data Types",
    files: standardLessonFiles("Variables and Data Types", "variables.c"),
  },
  {
    id: "operators-and-expressions",
    lessonNumber: 2,
    sequence: 3,
    title: "Operators and Expressions",
    difficulty: "Beginner",
    directory: "Operators and Expressions",
    files: standardLessonFiles("Operators and Expressions", "operators.c"),
  },
  {
    id: "conditional-statements",
    lessonNumber: 3,
    sequence: 4,
    title: "Conditional Statements",
    difficulty: "Beginner",
    directory: "Conditional Statements",
    files: standardLessonFiles("Conditional Statements", "conditions.c"),
  },
  {
    id: "loops-and-input-validation",
    lessonNumber: 4,
    sequence: 5,
    title: "Loops and Input Validation",
    difficulty: "Beginner",
    directory: "Loops and Input Validation",
    files: standardLessonFiles("Loops and Input Validation", "loops.c"),
  },
  {
    id: "functions-and-scope",
    lessonNumber: 5,
    sequence: 6,
    title: "Functions and Scope",
    difficulty: "Beginner–Intermediate",
    directory: "Functions and Scope",
    files: standardLessonFiles("Functions and Scope", "functions.c"),
  },
  {
    id: "arrays",
    lessonNumber: 6,
    sequence: 7,
    title: "Arrays",
    difficulty: "Intermediate",
    directory: "Arrays",
    files: standardLessonFiles("Arrays", "arrays.c"),
  },
  {
    id: "strings-and-character-handling",
    lessonNumber: 7,
    sequence: 8,
    title: "Strings and Character Handling",
    difficulty: "Intermediate",
    directory: "Strings and Character Handling",
    files: standardLessonFiles(
      "Strings and Character Handling",
      "strings.c",
    ),
  },
  {
    id: "pointers",
    lessonNumber: 8,
    sequence: 9,
    title: "Pointers",
    difficulty: "Intermediate",
    directory: "Pointers",
    files: standardLessonFiles("Pointers", "pointers.c"),
  },
  {
    id: "structures-and-enumerations",
    lessonNumber: 9,
    sequence: 10,
    title: "Structures and Enumerations",
    difficulty: "Intermediate",
    directory: "Structures and Enumerations",
    files: standardLessonFiles("Structures and Enumerations", "structures.c"),
  },
  {
    id: "file-input-and-output",
    lessonNumber: 10,
    sequence: 11,
    title: "File Input and Output",
    difficulty: "Intermediate",
    directory: "File Input and Output",
    files: standardLessonFiles("File Input and Output", "files.c"),
  },
  {
    id: "dynamic-memory-allocation",
    lessonNumber: 11,
    sequence: 12,
    title: "Dynamic Memory Allocation",
    difficulty: "Intermediate",
    directory: "Dynamic Memory Allocation",
    files: standardLessonFiles("Dynamic Memory Allocation", "dynamic_memory.c"),
  },
  {
    id: "header-files-and-multiple-source-files",
    lessonNumber: 12,
    sequence: 13,
    title: "Header Files and Multiple Source Files",
    difficulty: "Intermediate",
    directory: "Header Files and Multiple Source Files",
    files: [
      {
        id: "readme",
        name: "README.md",
        role: "readme",
        language: "markdown",
        relativePath:
          "Header Files and Multiple Source Files/README.md",
      },
      {
        id: "primary",
        name: "main.c",
        role: "primary",
        language: "c",
        relativePath: "Header Files and Multiple Source Files/main.c",
      },
      {
        id: "geometry",
        name: "geometry.c",
        role: "support",
        language: "c",
        relativePath: "Header Files and Multiple Source Files/geometry.c",
      },
      {
        id: "geometry-header",
        name: "geometry.h",
        role: "header",
        language: "c",
        relativePath: "Header Files and Multiple Source Files/geometry.h",
      },
      {
        id: "solution",
        name: "solution.c",
        role: "solution",
        language: "c",
        relativePath: "Header Files and Multiple Source Files/solution.c",
      },
    ],
  },
  {
    id: "searching-and-sorting",
    lessonNumber: 13,
    sequence: 14,
    title: "Searching and Sorting",
    difficulty: "Intermediate",
    directory: "Searching and Sorting",
    files: standardLessonFiles("Searching and Sorting", "search_sort.c"),
  },
  {
    id: "intermediate-console-project",
    lessonNumber: 14,
    sequence: 15,
    title: "Intermediate Console Project",
    difficulty: "Intermediate",
    directory: "Intermediate Console Project",
    files: [
      {
        id: "readme",
        name: "README.md",
        role: "readme",
        language: "markdown",
        relativePath: "Intermediate Console Project/README.md",
      },
      {
        id: "primary",
        name: "main.c",
        role: "primary",
        language: "c",
        relativePath: "Intermediate Console Project/main.c",
      },
      {
        id: "task",
        name: "task.c",
        role: "support",
        language: "c",
        relativePath: "Intermediate Console Project/task.c",
      },
      {
        id: "task-header",
        name: "task.h",
        role: "header",
        language: "c",
        relativePath: "Intermediate Console Project/task.h",
      },
      {
        id: "store",
        name: "store.c",
        role: "support",
        language: "c",
        relativePath: "Intermediate Console Project/store.c",
      },
      {
        id: "store-header",
        name: "store.h",
        role: "header",
        language: "c",
        relativePath: "Intermediate Console Project/store.h",
      },
      {
        id: "util",
        name: "util.c",
        role: "support",
        language: "c",
        relativePath: "Intermediate Console Project/util.c",
      },
      {
        id: "util-header",
        name: "util.h",
        role: "header",
        language: "c",
        relativePath: "Intermediate Console Project/util.h",
      },
      {
        id: "solution",
        name: "solution.c",
        role: "solution",
        language: "c",
        relativePath: "Intermediate Console Project/solution.c",
      },
    ],
  },
];
