import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { LessonFileDescriptor } from "@learning-app/shared";
import { CurriculumApiError } from "../api/curriculum-api";
import { loadLessonWorkspace } from "./workspace-loader";
import {
  initialWorkspaceStoreState,
  workspaceReducer,
} from "./workspace-reducer";
import type {
  LessonWorkspaceEntry,
  WorkspaceAction,
  WorkspaceStoreState,
  WorkspaceViewMode,
} from "./workspace-types";

interface WorkspaceContextValue {
  state: WorkspaceStoreState;
  dispatch: (action: WorkspaceAction) => void;
  ensureWorkspaceLoaded: (
    lessonId: string,
    descriptors: LessonFileDescriptor[],
  ) => void;
  retryWorkspaceLoad: (
    lessonId: string,
    descriptors: LessonFileDescriptor[],
  ) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    workspaceReducer,
    initialWorkspaceStoreState,
  );

  const loadWorkspace = useCallback(
    async (lessonId: string, descriptors: LessonFileDescriptor[]) => {
      dispatch({ type: "START_LOAD", lessonId });

      try {
        const workspace = await loadLessonWorkspace(lessonId, descriptors);
        dispatch({ type: "LOAD_SUCCESS", lessonId, workspace });
      } catch {
        dispatch({
          type: "LOAD_FAILURE",
          lessonId,
          message: "Unable to load code workspace",
        });
      }
    },
    [],
  );

  const ensureWorkspaceLoaded = useCallback(
    (lessonId: string, descriptors: LessonFileDescriptor[]) => {
      const entry = state.lessons[lessonId];
      if (
        entry?.status === "ready" ||
        entry?.status === "loading" ||
        entry?.status === "error"
      ) {
        return;
      }

      void loadWorkspace(lessonId, descriptors);
    },
    [loadWorkspace, state.lessons],
  );

  const retryWorkspaceLoad = useCallback(
    (lessonId: string, descriptors: LessonFileDescriptor[]) => {
      void loadWorkspace(lessonId, descriptors);
    },
    [loadWorkspace],
  );

  const value = useMemo(
    () => ({
      state,
      dispatch,
      ensureWorkspaceLoaded,
      retryWorkspaceLoad,
    }),
    [state, ensureWorkspaceLoaded, retryWorkspaceLoad],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspaceContext must be used within WorkspaceProvider");
  }
  return context;
}

export function useLessonWorkspaceEntry(
  lessonId: string,
  descriptors: LessonFileDescriptor[],
): LessonWorkspaceEntry {
  const { state, ensureWorkspaceLoaded } = useWorkspaceContext();
  const descriptorKey = useMemo(
    () => descriptors.map((file) => file.id).join(","),
    [descriptors],
  );

  useEffect(() => {
    ensureWorkspaceLoaded(lessonId, descriptors);
  }, [lessonId, descriptorKey, descriptors, ensureWorkspaceLoaded]);

  return state.lessons[lessonId] ?? { status: "idle" };
}

export function useLessonWorkspaceActions(lessonId: string) {
  const { dispatch } = useWorkspaceContext();

  return {
    selectFile: (fileId: string) =>
      dispatch({ type: "SELECT_FILE", lessonId, fileId }),
    updateDraft: (fileId: string, content: string) =>
      dispatch({ type: "UPDATE_DRAFT", lessonId, fileId, content }),
    resetFile: (fileId: string) =>
      dispatch({ type: "RESET_FILE", lessonId, fileId }),
    resetWorkspace: () => dispatch({ type: "RESET_WORKSPACE", lessonId }),
    setViewMode: (viewMode: WorkspaceViewMode) =>
      dispatch({ type: "SET_VIEW_MODE", lessonId, viewMode }),
  };
}

export function isWorkspaceLoadError(entry: LessonWorkspaceEntry): boolean {
  return entry.status === "error";
}

export function getWorkspaceLoadErrorMessage(entry: LessonWorkspaceEntry): string {
  return entry.status === "error" ? entry.message : "Unable to load code workspace";
}

export function isWorkspaceApiFailure(error: unknown): boolean {
  return error instanceof CurriculumApiError;
}
