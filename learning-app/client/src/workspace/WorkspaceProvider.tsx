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
  getFileOriginalContent,
  useDraftPersistence,
} from "./use-draft-persistence";
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
  scheduleDraftSave: (
    lessonId: string,
    fileId: string,
    content: string,
    originalContent: string,
  ) => void;
  deletePersistedDraft: (lessonId: string, fileId: string) => Promise<void>;
  deleteAllPersistedDrafts: (lessonId: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    workspaceReducer,
    initialWorkspaceStoreState,
  );
  const { scheduleDraftSave, deletePersistedDraft, deleteAllPersistedDrafts } =
    useDraftPersistence(dispatch);

  const loadWorkspace = useCallback(
    async (lessonId: string, descriptors: LessonFileDescriptor[]) => {
      dispatch({ type: "START_LOAD", lessonId });

      try {
        const loaded = await loadLessonWorkspace(lessonId, descriptors);
        dispatch({ type: "LOAD_SUCCESS", lessonId, workspace: loaded.workspace });
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
      scheduleDraftSave,
      deletePersistedDraft,
      deleteAllPersistedDrafts,
    }),
    [
      state,
      ensureWorkspaceLoaded,
      retryWorkspaceLoad,
      scheduleDraftSave,
      deletePersistedDraft,
      deleteAllPersistedDrafts,
    ],
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
  const {
    dispatch,
    state,
    scheduleDraftSave,
    deletePersistedDraft,
    deleteAllPersistedDrafts,
  } = useWorkspaceContext();

  const updateDraft = useCallback(
    (fileId: string, content: string) => {
      dispatch({ type: "UPDATE_DRAFT", lessonId, fileId, content });

      const entry = state.lessons[lessonId];
      if (entry?.status !== "ready") {
        return;
      }

      const originalContent = getFileOriginalContent(entry.workspace, fileId);
      if (originalContent === undefined) {
        return;
      }

      scheduleDraftSave(lessonId, fileId, content, originalContent);
    },
    [dispatch, lessonId, scheduleDraftSave, state.lessons],
  );

  const resetFile = useCallback(
    (fileId: string) => {
      dispatch({ type: "RESET_FILE", lessonId, fileId });
      void deletePersistedDraft(lessonId, fileId);
    },
    [deletePersistedDraft, dispatch, lessonId],
  );

  const resetWorkspace = useCallback(() => {
    dispatch({ type: "RESET_WORKSPACE", lessonId });
    void deleteAllPersistedDrafts(lessonId);
  }, [deleteAllPersistedDrafts, dispatch, lessonId]);

  const applyStaleDraft = useCallback(
    (fileId: string, content: string) => {
      dispatch({ type: "APPLY_STALE_DRAFT", lessonId, fileId, content });

      const entry = state.lessons[lessonId];
      const originalContent =
        entry?.status === "ready"
          ? getFileOriginalContent(entry.workspace, fileId)
          : undefined;

      if (originalContent !== undefined) {
        scheduleDraftSave(lessonId, fileId, content, originalContent);
      }
    },
    [dispatch, lessonId, scheduleDraftSave, state.lessons],
  );

  const discardStaleDraft = useCallback(
    (fileId: string) => {
      dispatch({ type: "DISCARD_STALE_DRAFT", lessonId, fileId });
      void deletePersistedDraft(lessonId, fileId);
    },
    [deletePersistedDraft, dispatch, lessonId],
  );

  return {
    selectFile: (fileId: string) =>
      dispatch({ type: "SELECT_FILE", lessonId, fileId }),
    updateDraft,
    resetFile,
    resetWorkspace,
    setViewMode: (viewMode: WorkspaceViewMode) =>
      dispatch({ type: "SET_VIEW_MODE", lessonId, viewMode }),
    applyStaleDraft,
    discardStaleDraft,
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
