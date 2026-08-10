import type {
  EditableWorkspaceFile,
  LessonWorkspace,
  WorkspaceAction,
  WorkspaceStoreState,
} from "./workspace-types";

export const initialWorkspaceStoreState: WorkspaceStoreState = {
  lessons: {},
};

function updateWorkspace(
  workspace: LessonWorkspace,
  updater: (workspace: LessonWorkspace) => LessonWorkspace,
): LessonWorkspace {
  return updater(workspace);
}

function updateFile(
  workspace: LessonWorkspace,
  fileId: string,
  updater: (file: EditableWorkspaceFile) => EditableWorkspaceFile,
): LessonWorkspace {
  return {
    ...workspace,
    files: workspace.files.map((file) =>
      file.id === fileId ? updater(file) : file,
    ),
  };
}

export function workspaceReducer(
  state: WorkspaceStoreState,
  action: WorkspaceAction,
): WorkspaceStoreState {
  switch (action.type) {
    case "START_LOAD":
      return {
        ...state,
        lessons: {
          ...state.lessons,
          [action.lessonId]: { status: "loading" },
        },
      };

    case "LOAD_SUCCESS":
      return {
        ...state,
        lessons: {
          ...state.lessons,
          [action.lessonId]: {
            status: "ready",
            workspace: action.workspace,
          },
        },
      };

    case "LOAD_FAILURE":
      return {
        ...state,
        lessons: {
          ...state.lessons,
          [action.lessonId]: {
            status: "error",
            message: action.message,
          },
        },
      };

    case "SELECT_FILE": {
      const entry = state.lessons[action.lessonId];
      if (!entry || entry.status !== "ready") {
        return state;
      }

      return {
        ...state,
        lessons: {
          ...state.lessons,
          [action.lessonId]: {
            status: "ready",
            workspace: updateWorkspace(entry.workspace, (workspace) => ({
              ...workspace,
              activeFileId: action.fileId,
            })),
          },
        },
      };
    }

    case "UPDATE_DRAFT": {
      const entry = state.lessons[action.lessonId];
      if (!entry || entry.status !== "ready") {
        return state;
      }

      return {
        ...state,
        lessons: {
          ...state.lessons,
          [action.lessonId]: {
            status: "ready",
            workspace: updateFile(entry.workspace, action.fileId, (file) => ({
              ...file,
              draftContent: action.content,
            })),
          },
        },
      };
    }

    case "RESET_FILE": {
      const entry = state.lessons[action.lessonId];
      if (!entry || entry.status !== "ready") {
        return state;
      }

      return {
        ...state,
        lessons: {
          ...state.lessons,
          [action.lessonId]: {
            status: "ready",
            workspace: updateFile(entry.workspace, action.fileId, (file) => ({
              ...file,
              draftContent: file.originalContent,
            })),
          },
        },
      };
    }

    case "RESET_WORKSPACE": {
      const entry = state.lessons[action.lessonId];
      if (!entry || entry.status !== "ready") {
        return state;
      }

      return {
        ...state,
        lessons: {
          ...state.lessons,
          [action.lessonId]: {
            status: "ready",
            workspace: updateWorkspace(entry.workspace, (workspace) => ({
              ...workspace,
              files: workspace.files.map((file) => ({
                ...file,
                draftContent: file.originalContent,
              })),
            })),
          },
        },
      };
    }

    case "SET_VIEW_MODE": {
      const entry = state.lessons[action.lessonId];
      if (!entry || entry.status !== "ready") {
        return state;
      }

      return {
        ...state,
        lessons: {
          ...state.lessons,
          [action.lessonId]: {
            status: "ready",
            workspace: updateWorkspace(entry.workspace, (workspace) => ({
              ...workspace,
              viewMode: action.viewMode,
            })),
          },
        },
      };
    }

    default:
      return state;
  }
}

export function createLessonWorkspace(
  lessonId: string,
  files: EditableWorkspaceFile[],
): LessonWorkspace {
  const primaryFile =
    files.find((file) => file.role === "primary") ?? files[0];

  if (!primaryFile) {
    throw new Error("Workspace requires at least one editable file");
  }

  return {
    lessonId,
    activeFileId: primaryFile.id,
    viewMode: "edit",
    files,
  };
}
