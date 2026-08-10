import type { LessonFileDescriptor } from "@learning-app/shared";
import { getLessonFile } from "../api/curriculum-api";
import { createLessonWorkspace } from "./workspace-reducer";
import type { EditableFileRole, EditableWorkspaceFile, LessonWorkspace } from "./workspace-types";

const EDITABLE_ROLES = new Set<EditableFileRole>(["primary", "support", "header"]);

export function isEditableRole(
  role: LessonFileDescriptor["role"],
): role is EditableFileRole {
  return EDITABLE_ROLES.has(role as EditableFileRole);
}

export function getEditableDescriptors(
  files: LessonFileDescriptor[],
): LessonFileDescriptor[] {
  return files.filter((file) => isEditableRole(file.role));
}

export async function loadLessonWorkspace(
  lessonId: string,
  descriptors: LessonFileDescriptor[],
): Promise<LessonWorkspace> {
  const editableDescriptors = getEditableDescriptors(descriptors);

  if (editableDescriptors.length === 0) {
    throw new Error("Lesson has no editable source files");
  }

  const fileContents = await Promise.all(
    editableDescriptors.map(async (descriptor) => {
      const response = await getLessonFile(lessonId, descriptor.id);
      return {
        id: descriptor.id,
        name: descriptor.name,
        role: descriptor.role as EditableFileRole,
        language: "c" as const,
        originalContent: response.content,
        draftContent: response.content,
      } satisfies EditableWorkspaceFile;
    }),
  );

  return createLessonWorkspace(lessonId, fileContents);
}
