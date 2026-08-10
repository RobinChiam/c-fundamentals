import { useCallback, useEffect, useRef } from "react";
import {
  PersistenceApiUnavailableError,
  deleteLessonDraft,
  deleteLessonDrafts,
  saveLessonDraft,
} from "../api/persistence-api";
import { DRAFT_AUTOSAVE_DEBOUNCE_MS } from "./draft-persistence-types";
import type { DraftSaveStatus } from "./draft-persistence-types";
import type { LessonWorkspace } from "./workspace-types";

interface PendingSave {
  lessonId: string;
  fileId: string;
  content: string;
  originalContent: string;
  version: number;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function draftKey(lessonId: string, fileId: string): string {
  return `${lessonId}:${fileId}`;
}

export function useDraftPersistence(
  dispatch: (action: {
    type: "SET_SAVE_STATUS";
    lessonId: string;
    saveStatus: DraftSaveStatus;
  }) => void,
) {
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const versionsRef = useRef<Map<string, number>>(new Map());
  const pendingRef = useRef<Map<string, PendingSave>>(new Map());
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const supersededByDeleteRef = useRef<Set<string>>(new Set());

  const clearTimer = useCallback((key: string) => {
    const timer = timersRef.current.get(key);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(key);
    }
  }, []);

  const abortInFlightSave = useCallback((key: string) => {
    const controller = abortControllersRef.current.get(key);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(key);
    }
  }, []);

  const invalidateInFlightSave = useCallback(
    (key: string): number => {
      abortInFlightSave(key);
      const version = (versionsRef.current.get(key) ?? 0) + 1;
      versionsRef.current.set(key, version);
      return version;
    },
    [abortInFlightSave],
  );

  const persistDraft = useCallback(
    async (pending: PendingSave) => {
      const key = draftKey(pending.lessonId, pending.fileId);
      const expectedVersion = pending.version;

      if (versionsRef.current.get(key) !== expectedVersion) {
        return;
      }

      const controller = new AbortController();
      abortControllersRef.current.set(key, controller);

      dispatch({
        type: "SET_SAVE_STATUS",
        lessonId: pending.lessonId,
        saveStatus: "saving",
      });

      try {
        if (pending.content === pending.originalContent) {
          await deleteLessonDraft(pending.lessonId, pending.fileId, {
            signal: controller.signal,
          });
        } else {
          await saveLessonDraft(
            pending.lessonId,
            pending.fileId,
            pending.content,
            { signal: controller.signal },
          );
        }

        if (versionsRef.current.get(key) !== expectedVersion) {
          if (
            pending.content !== pending.originalContent &&
            supersededByDeleteRef.current.has(key)
          ) {
            supersededByDeleteRef.current.delete(key);
            void deleteLessonDraft(pending.lessonId, pending.fileId).catch(
              () => {},
            );
          }
          return;
        }

        dispatch({
          type: "SET_SAVE_STATUS",
          lessonId: pending.lessonId,
          saveStatus: "saved",
        });
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }

        if (versionsRef.current.get(key) !== expectedVersion) {
          return;
        }

        dispatch({
          type: "SET_SAVE_STATUS",
          lessonId: pending.lessonId,
          saveStatus:
            error instanceof PersistenceApiUnavailableError
              ? "persistence_unavailable"
              : "save_failed",
        });
      } finally {
        if (abortControllersRef.current.get(key) === controller) {
          abortControllersRef.current.delete(key);
        }
      }
    },
    [dispatch],
  );

  const scheduleDraftSave = useCallback(
    (
      lessonId: string,
      fileId: string,
      content: string,
      originalContent: string,
    ) => {
      const key = draftKey(lessonId, fileId);
      supersededByDeleteRef.current.delete(key);
      abortInFlightSave(key);

      const version = (versionsRef.current.get(key) ?? 0) + 1;
      versionsRef.current.set(key, version);

      pendingRef.current.set(key, {
        lessonId,
        fileId,
        content,
        originalContent,
        version,
      });

      clearTimer(key);

      const timer = setTimeout(() => {
        timersRef.current.delete(key);
        const pending = pendingRef.current.get(key);
        if (!pending || pending.version !== version) {
          return;
        }
        void persistDraft(pending);
      }, DRAFT_AUTOSAVE_DEBOUNCE_MS);

      timersRef.current.set(key, timer);
    },
    [abortInFlightSave, clearTimer, persistDraft],
  );

  const deletePersistedDraft = useCallback(
    async (lessonId: string, fileId: string) => {
      const key = draftKey(lessonId, fileId);
      clearTimer(key);
      pendingRef.current.delete(key);
      supersededByDeleteRef.current.add(key);
      invalidateInFlightSave(key);

      try {
        await deleteLessonDraft(lessonId, fileId);
        dispatch({
          type: "SET_SAVE_STATUS",
          lessonId,
          saveStatus: "saved",
        });
      } catch (error) {
        supersededByDeleteRef.current.delete(key);
        dispatch({
          type: "SET_SAVE_STATUS",
          lessonId,
          saveStatus:
            error instanceof PersistenceApiUnavailableError
              ? "persistence_unavailable"
              : "save_failed",
        });
      }
    },
    [clearTimer, dispatch, invalidateInFlightSave],
  );

  const deleteAllPersistedDrafts = useCallback(
    async (lessonId: string) => {
      const keysToInvalidate = new Set<string>();

      for (const key of timersRef.current.keys()) {
        if (key.startsWith(`${lessonId}:`)) {
          clearTimer(key);
          keysToInvalidate.add(key);
        }
      }

      for (const key of pendingRef.current.keys()) {
        if (key.startsWith(`${lessonId}:`)) {
          pendingRef.current.delete(key);
          keysToInvalidate.add(key);
        }
      }

      for (const key of abortControllersRef.current.keys()) {
        if (key.startsWith(`${lessonId}:`)) {
          keysToInvalidate.add(key);
        }
      }

      for (const key of versionsRef.current.keys()) {
        if (key.startsWith(`${lessonId}:`)) {
          keysToInvalidate.add(key);
        }
      }

      for (const key of keysToInvalidate) {
        supersededByDeleteRef.current.add(key);
        invalidateInFlightSave(key);
      }

      try {
        await deleteLessonDrafts(lessonId);
        dispatch({
          type: "SET_SAVE_STATUS",
          lessonId,
          saveStatus: "saved",
        });
      } catch (error) {
        for (const key of keysToInvalidate) {
          supersededByDeleteRef.current.delete(key);
        }
        dispatch({
          type: "SET_SAVE_STATUS",
          lessonId,
          saveStatus:
            error instanceof PersistenceApiUnavailableError
              ? "persistence_unavailable"
              : "save_failed",
        });
      }
    },
    [clearTimer, dispatch, invalidateInFlightSave],
  );

  useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer);
      }
      timersRef.current.clear();
      for (const controller of abortControllersRef.current.values()) {
        controller.abort();
      }
      abortControllersRef.current.clear();
    };
  }, []);

  return {
    scheduleDraftSave,
    deletePersistedDraft,
    deleteAllPersistedDrafts,
  };
}

export function getFileOriginalContent(
  workspace: LessonWorkspace,
  fileId: string,
): string | undefined {
  return workspace.files.find((file) => file.id === fileId)?.originalContent;
}
