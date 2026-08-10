export const DRAFT_AUTOSAVE_DEBOUNCE_MS = 750;

export type DraftSaveStatus =
  | "saved"
  | "saving"
  | "save_failed"
  | "persistence_unavailable";

export interface StaleDraftInfo {
  fileId: string;
  content: string;
}

export function getSaveStatusLabel(status: DraftSaveStatus): string {
  switch (status) {
    case "saved":
      return "Saved";
    case "saving":
      return "Saving…";
    case "save_failed":
      return "Save failed";
    case "persistence_unavailable":
      return "Persistence unavailable";
  }
}
