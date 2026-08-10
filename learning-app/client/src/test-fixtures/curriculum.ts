import type {
  CurriculumResponse,
  LessonDetail,
  LessonFileContent,
  LessonSummary,
} from "@learning-app/shared";

export const mockCurriculumLessons: LessonSummary[] = [
  {
    id: "basic-io",
    lessonNumber: 0,
    sequence: 0,
    title: "Basic IO",
    difficulty: "Beginner (starter)",
  },
  {
    id: "drawing-shapes",
    lessonNumber: 0,
    sequence: 1,
    title: "Drawing Shapes",
    difficulty: "Beginner (starter)",
  },
  {
    id: "variables-and-data-types",
    lessonNumber: 1,
    sequence: 2,
    title: "Variables and Data Types",
    difficulty: "Beginner",
  },
  {
    id: "arrays",
    lessonNumber: 6,
    sequence: 7,
    title: "Arrays",
    difficulty: "Intermediate",
  },
  {
    id: "header-files-and-multiple-source-files",
    lessonNumber: 12,
    sequence: 13,
    title: "Header Files and Multiple Source Files",
    difficulty: "Intermediate",
  },
  {
    id: "intermediate-console-project",
    lessonNumber: 14,
    sequence: 15,
    title: "Intermediate Console Project",
    difficulty: "Intermediate",
  },
];

export const mockCurriculumResponse: CurriculumResponse = {
  lessons: mockCurriculumLessons,
};

export const mockArraysLesson: LessonDetail = {
  id: "arrays",
  lessonNumber: 6,
  sequence: 7,
  title: "Arrays",
  difficulty: "Intermediate",
  files: [
    {
      id: "readme",
      name: "README.md",
      role: "readme",
      language: "markdown",
    },
    {
      id: "primary",
      name: "arrays.c",
      role: "primary",
      language: "c",
    },
    {
      id: "solution",
      name: "solution.c",
      role: "solution",
      language: "c",
    },
  ],
};

export const mockLesson12: LessonDetail = {
  id: "header-files-and-multiple-source-files",
  lessonNumber: 12,
  sequence: 13,
  title: "Header Files and Multiple Source Files",
  difficulty: "Intermediate",
  files: [
    {
      id: "readme",
      name: "README.md",
      role: "readme",
      language: "markdown",
    },
    {
      id: "primary",
      name: "main.c",
      role: "primary",
      language: "c",
    },
    {
      id: "geometry",
      name: "geometry.c",
      role: "support",
      language: "c",
    },
    {
      id: "geometry-header",
      name: "geometry.h",
      role: "header",
      language: "c",
    },
    {
      id: "solution",
      name: "solution.c",
      role: "solution",
      language: "c",
    },
  ],
};

export const mockLesson14: LessonDetail = {
  id: "intermediate-console-project",
  lessonNumber: 14,
  sequence: 15,
  title: "Intermediate Console Project",
  difficulty: "Intermediate",
  files: [
    {
      id: "readme",
      name: "README.md",
      role: "readme",
      language: "markdown",
    },
    {
      id: "primary",
      name: "main.c",
      role: "primary",
      language: "c",
    },
    {
      id: "task",
      name: "task.c",
      role: "support",
      language: "c",
    },
    {
      id: "task-header",
      name: "task.h",
      role: "header",
      language: "c",
    },
    {
      id: "store",
      name: "store.c",
      role: "support",
      language: "c",
    },
    {
      id: "store-header",
      name: "store.h",
      role: "header",
      language: "c",
    },
    {
      id: "util",
      name: "util.c",
      role: "support",
      language: "c",
    },
    {
      id: "util-header",
      name: "util.h",
      role: "header",
      language: "c",
    },
    {
      id: "solution",
      name: "solution.c",
      role: "solution",
      language: "c",
    },
  ],
};

export const mockReadmeContent: LessonFileContent = {
  lessonId: "arrays",
  file: {
    id: "readme",
    name: "README.md",
    role: "readme",
    language: "markdown",
  },
  content: `# Arrays

| Topic | Detail |
| --- | --- |
| Goal | Work with arrays |

- [ ] Review indexing
- [ ] Practice traversal

Next: [Pointers](../Pointers/)
`,
};

export const mockPrimarySourceContent: LessonFileContent = {
  lessonId: "arrays",
  file: {
    id: "primary",
    name: "arrays.c",
    role: "primary",
    language: "c",
  },
  content: "/* Lesson 6 — Arrays */\nint main(void) { return 0; }\n",
};

export const mockGeometrySourceContent: LessonFileContent = {
  lessonId: "header-files-and-multiple-source-files",
  file: {
    id: "geometry",
    name: "geometry.c",
    role: "support",
    language: "c",
  },
  content: "/* geometry.c */\n",
};
