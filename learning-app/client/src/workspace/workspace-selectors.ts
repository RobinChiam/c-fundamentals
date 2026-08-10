import type { EditableWorkspaceFile, LessonWorkspace } from "./workspace-types";

export function isFileDirty(file: EditableWorkspaceFile): boolean {
  return file.draftContent !== file.originalContent;
}

export function countDirtyFiles(workspace: LessonWorkspace): number {
  return workspace.files.filter(isFileDirty).length;
}

export function getActiveFile(
  workspace: LessonWorkspace,
): EditableWorkspaceFile | undefined {
  return workspace.files.find((file) => file.id === workspace.activeFileId);
}

export function isWorkspaceDirty(workspace: LessonWorkspace): boolean {
  return countDirtyFiles(workspace) > 0;
}

export function getDirtyFileIds(workspace: LessonWorkspace): Set<string> {
  return new Set(
    workspace.files.filter(isFileDirty).map((file) => file.id),
  );
}
