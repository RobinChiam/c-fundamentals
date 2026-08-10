import type { EditableWorkspaceFile, LessonWorkspace } from "../../workspace/workspace-types";
import {
  countDirtyFiles,
  getActiveFile,
  isFileDirty,
  isWorkspaceDirty,
} from "../../workspace/workspace-selectors";

interface WorkspaceToolbarProps {
  workspace: LessonWorkspace;
  activeFile: EditableWorkspaceFile;
  onResetFile: () => void;
  onResetWorkspace: () => void;
  onSetViewMode: (mode: "edit" | "compare") => void;
  onCopyDraft: () => void;
}

export function WorkspaceToolbar({
  workspace,
  activeFile,
  onResetFile,
  onResetWorkspace,
  onSetViewMode,
  onCopyDraft,
}: WorkspaceToolbarProps) {
  const dirtyCount = countDirtyFiles(workspace);
  const activeDirty = isFileDirty(activeFile);
  const workspaceDirty = isWorkspaceDirty(workspace);

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-700" aria-live="polite">
          {dirtyCount === 0
            ? "No modified files"
            : dirtyCount === 1
              ? "1 modified file"
              : `${dirtyCount} modified files`}
        </p>
        <p className="text-xs text-slate-500">
          Drafts are session-only. Refreshing or restarting the app discards
          unsaved edits.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div
          className="inline-flex rounded-md border border-slate-300 bg-white p-1"
          role="group"
          aria-label="Workspace view mode"
        >
          <button
            type="button"
            onClick={() => onSetViewMode("edit")}
            aria-pressed={workspace.viewMode === "edit"}
            className={
              workspace.viewMode === "edit"
                ? "rounded px-3 py-1.5 text-sm font-medium bg-slate-900 text-white"
                : "rounded px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100"
            }
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onSetViewMode("compare")}
            aria-pressed={workspace.viewMode === "compare"}
            className={
              workspace.viewMode === "compare"
                ? "rounded px-3 py-1.5 text-sm font-medium bg-slate-900 text-white"
                : "rounded px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100"
            }
          >
            Compare
          </button>
        </div>

        <button
          type="button"
          onClick={onResetFile}
          disabled={!activeDirty}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reset file
        </button>
        <button
          type="button"
          onClick={onResetWorkspace}
          disabled={!workspaceDirty}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reset all
        </button>
        <button
          type="button"
          onClick={onCopyDraft}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Copy current draft
        </button>
      </div>
    </div>
  );
}

export function getActiveWorkspaceFile(workspace: LessonWorkspace) {
  return getActiveFile(workspace);
}
