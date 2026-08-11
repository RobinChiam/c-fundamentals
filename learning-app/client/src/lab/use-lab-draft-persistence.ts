import { useCallback, useEffect, useRef } from "react";
import {
  LabsApiUnavailableError,
  deleteLabDraft,
  saveLabDraft,
} from "../api/labs-api";
import { LAB_DRAFT_AUTOSAVE_DEBOUNCE_MS, type LabDraftSaveStatus } from "./lab-draft-types";

interface PendingLabSave {
  labId: string;
  fileId: string;
  content: string;
  starterContent: string;
  version: number;
}

function draftKey(labId: string, fileId: string): string {
  return `${labId}:${fileId}`;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function useLabDraftPersistence(
  setSaveStatus: (status: LabDraftSaveStatus) => void,
) {
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const versionsRef = useRef<Map<string, number>>(new Map());
  const pendingRef = useRef<Map<string, PendingLabSave>>(new Map());
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const clearTimer = useCallback((key: string) => {
    const timer = timersRef.current.get(key);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(key);
    }
  }, []);

  const persistDraft = useCallback(
    async (pending: PendingLabSave) => {
      const key = draftKey(pending.labId, pending.fileId);
      const expectedVersion = pending.version;

      if (versionsRef.current.get(key) !== expectedVersion) {
        return;
      }

      const controller = new AbortController();
      abortControllersRef.current.set(key, controller);
      setSaveStatus("saving");

      try {
        if (pending.content === pending.starterContent) {
          await deleteLabDraft(pending.labId, pending.fileId, {
            signal: controller.signal,
          });
        } else {
          await saveLabDraft(
            pending.labId,
            pending.fileId,
            pending.content,
            { signal: controller.signal },
          );
        }

        if (versionsRef.current.get(key) !== expectedVersion) {
          return;
        }

        setSaveStatus("saved");
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }
        if (versionsRef.current.get(key) !== expectedVersion) {
          return;
        }
        setSaveStatus(
          error instanceof LabsApiUnavailableError
            ? "persistence_unavailable"
            : "save_failed",
        );
      } finally {
        if (abortControllersRef.current.get(key) === controller) {
          abortControllersRef.current.delete(key);
        }
      }
    },
    [setSaveStatus],
  );

  const scheduleDraftSave = useCallback(
    (
      labId: string,
      fileId: string,
      content: string,
      starterContent: string,
    ) => {
      const key = draftKey(labId, fileId);
      const controller = abortControllersRef.current.get(key);
      controller?.abort();

      const version = (versionsRef.current.get(key) ?? 0) + 1;
      versionsRef.current.set(key, version);
      pendingRef.current.set(key, {
        labId,
        fileId,
        content,
        starterContent,
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
      }, LAB_DRAFT_AUTOSAVE_DEBOUNCE_MS);
      timersRef.current.set(key, timer);
    },
    [clearTimer, persistDraft],
  );

  useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer);
      }
      for (const controller of abortControllersRef.current.values()) {
        controller.abort();
      }
    };
  }, []);

  return { scheduleDraftSave };
}
