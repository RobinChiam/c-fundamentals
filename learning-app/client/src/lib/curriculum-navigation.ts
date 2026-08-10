import type { LessonSummary } from "@learning-app/shared";

export type CurriculumGroupLabel =
  | "Starter"
  | "Foundations"
  | "Intermediate"
  | "Capstone";

export function getCurriculumGroupLabel(
  lesson: LessonSummary,
): CurriculumGroupLabel {
  if (lesson.lessonNumber === 0) {
    return "Starter";
  }

  if (lesson.lessonNumber >= 1 && lesson.lessonNumber <= 4) {
    return "Foundations";
  }

  if (lesson.lessonNumber === 14) {
    return "Capstone";
  }

  return "Intermediate";
}

export function groupLessonsByPresentation(
  lessons: LessonSummary[],
): Array<{ label: CurriculumGroupLabel; lessons: LessonSummary[] }> {
  const ordered = [...lessons].sort((left, right) => left.sequence - right.sequence);
  const groups = new Map<CurriculumGroupLabel, LessonSummary[]>();
  const labels: CurriculumGroupLabel[] = [
    "Starter",
    "Foundations",
    "Intermediate",
    "Capstone",
  ];

  for (const label of labels) {
    groups.set(label, []);
  }

  for (const lesson of ordered) {
    const label = getCurriculumGroupLabel(lesson);
    groups.get(label)?.push(lesson);
  }

  return labels
    .map((label) => ({
      label,
      lessons: groups.get(label) ?? [],
    }))
    .filter((group) => group.lessons.length > 0);
}

export function getAdjacentLessons(
  lessons: LessonSummary[],
  lessonId: string,
): {
  previous: LessonSummary | null;
  next: LessonSummary | null;
} {
  const ordered = [...lessons].sort((left, right) => left.sequence - right.sequence);
  const index = ordered.findIndex((lesson) => lesson.id === lessonId);

  if (index === -1) {
    return { previous: null, next: null };
  }

  return {
    previous: index > 0 ? (ordered[index - 1] ?? null) : null,
    next:
      index < ordered.length - 1 ? (ordered[index + 1] ?? null) : null,
  };
}
