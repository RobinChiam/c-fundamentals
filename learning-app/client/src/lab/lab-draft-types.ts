export const LAB_DRAFT_AUTOSAVE_DEBOUNCE_MS = 500;

export type LabDraftSaveStatus =
  | "idle"
  | "saving"
  | "saved"
  | "save_failed"
  | "persistence_unavailable";
