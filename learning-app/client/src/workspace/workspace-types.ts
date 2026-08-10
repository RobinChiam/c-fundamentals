import type { StaleDraftInfo, DraftSaveStatus } from "./draft-persistence-types";

export type EditableFileRole = "primary" | "support" | "header";

export interface EditableWorkspaceFile {
  id: string;
  name: string;
  role: EditableFileRole;
  language: "c";
  originalContent: string;
  draftContent: string;
}

export type WorkspaceViewMode = "edit" | "compare";

export interface LessonWorkspace {
  lessonId: string;
  activeFileId: string;
  viewMode: WorkspaceViewMode;
  files: EditableWorkspaceFile[];
  saveStatus: DraftSaveStatus;
  staleDrafts: StaleDraftInfo[];
}

export type LessonWorkspaceEntry =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; workspace: LessonWorkspace };

export interface WorkspaceStoreState {
  lessons: Record<string, LessonWorkspaceEntry>;
}

export type WorkspaceAction =
  | { type: "START_LOAD"; lessonId: string }
  | {
      type: "LOAD_SUCCESS";
      lessonId: string;
      workspace: LessonWorkspace;
    }
  | { type: "LOAD_FAILURE"; lessonId: string; message: string }
  | { type: "SELECT_FILE"; lessonId: string; fileId: string }
  | { type: "UPDATE_DRAFT"; lessonId: string; fileId: string; content: string }
  | { type: "RESET_FILE"; lessonId: string; fileId: string }
  | { type: "RESET_WORKSPACE"; lessonId: string }
  | { type: "SET_VIEW_MODE"; lessonId: string; viewMode: WorkspaceViewMode }
  | { type: "SET_SAVE_STATUS"; lessonId: string; saveStatus: DraftSaveStatus }
  | {
      type: "APPLY_STALE_DRAFT";
      lessonId: string;
      fileId: string;
      content: string;
    }
  | { type: "DISCARD_STALE_DRAFT"; lessonId: string; fileId: string }
  | {
      type: "SET_STALE_DRAFTS";
      lessonId: string;
      staleDrafts: StaleDraftInfo[];
    };
