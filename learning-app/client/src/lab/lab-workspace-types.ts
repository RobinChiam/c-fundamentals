import type {
  LabDetail,
  LabDraft,
  LabEvaluationResponse,
  LabAttemptSummary,
  HintRevealResponse,
} from "@learning-app/shared";
import type { LabDraftSaveStatus } from "./lab-draft-types";

export interface LabWorkspaceState {
  lab: LabDetail;
  draftContent: string;
  starterContent: string;
  dirty: boolean;
  saveStatus: LabDraftSaveStatus;
  staleDraft: LabDraft | null;
  evaluation: LabEvaluationResponse | null;
  evaluating: boolean;
  runnerUnavailable: boolean;
  attempts: LabAttemptSummary[];
  revealedHints: HintRevealResponse[];
  solutionContent: string | null;
  solutionConfirmOpen: boolean;
}

export function createInitialLabWorkspaceState(lab: LabDetail): LabWorkspaceState {
  const starter = lab.starterFiles[0];
  const starterContent = starter?.content ?? "";

  return {
    lab,
    draftContent: starterContent,
    starterContent,
    dirty: false,
    saveStatus: "idle",
    staleDraft: null,
    evaluation: null,
    evaluating: false,
    runnerUnavailable: false,
    attempts: [],
    revealedHints: lab.revealedHints.map((hint) => ({
      index: hint.index,
      content: hint.content,
      hintsRevealed: hint.index + 1,
    })),
    solutionContent: null,
    solutionConfirmOpen: false,
  };
}
