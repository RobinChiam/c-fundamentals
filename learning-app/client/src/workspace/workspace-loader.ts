import type { LessonFileDescriptor } from "@learning-app/shared";
import { getLessonFile } from "../api/curriculum-api";
import {
  PersistenceApiUnavailableError,
  getLessonDrafts,
} from "../api/persistence-api";
import { createLessonWorkspace } from "./workspace-reducer";
import type { StaleDraftInfo } from "./draft-persistence-types";
import type {
  EditableFileRole,
  EditableWorkspaceFile,
  LessonWorkspace,
} from "./workspace-types";

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

export interface LoadedLessonWorkspace {
  workspace: LessonWorkspace;
  staleDrafts: StaleDraftInfo[];
}

export async function loadLessonWorkspace(
  lessonId: string,
  descriptors: LessonFileDescriptor[],
): Promise<LoadedLessonWorkspace> {
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

  const workspace = createLessonWorkspace(lessonId, fileContents);
  const staleDrafts: StaleDraftInfo[] = [];

  try {
    const draftsResponse = await getLessonDrafts(lessonId);

    for (const savedDraft of draftsResponse.drafts) {
      const file = workspace.files.find((entry) => entry.id === savedDraft.fileId);
      if (!file) {
        continue;
      }

      if (savedDraft.stale) {
        staleDrafts.push({
          fileId: savedDraft.fileId,
          content: savedDraft.content,
        });
        continue;
      }

      file.draftContent = savedDraft.content;
    }
  } catch (error) {
    if (error instanceof PersistenceApiUnavailableError) {
      return {
        workspace: {
          ...workspace,
          saveStatus: "persistence_unavailable",
        },
        staleDrafts: [],
      };
    }
    throw error;
  }

  return {
    workspace: {
      ...workspace,
      staleDrafts,
      saveStatus: "saved",
    },
    staleDrafts,
  };
}
