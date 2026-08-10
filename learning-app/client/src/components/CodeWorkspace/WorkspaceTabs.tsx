import type { LessonWorkspace } from "../../workspace/workspace-types";
import { getDirtyFileIds } from "../../workspace/workspace-selectors";

interface WorkspaceTabsProps {
  workspace: LessonWorkspace;
  onSelectFile: (fileId: string) => void;
}

export function WorkspaceTabs({ workspace, onSelectFile }: WorkspaceTabsProps) {
  const dirtyFileIds = getDirtyFileIds(workspace);

  return (
    <div
      className="mb-4 flex flex-wrap gap-2"
      role="tablist"
      aria-label="Source file tabs"
    >
      {workspace.files.map((file) => {
        const isSelected = file.id === workspace.activeFileId;
        const isDirty = dirtyFileIds.has(file.id);

        return (
          <button
            key={file.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-controls={`workspace-panel-${file.id}`}
            id={`workspace-tab-${file.id}`}
            onClick={() => onSelectFile(file.id)}
            className={
              isSelected
                ? "rounded-md border border-slate-900 bg-slate-900 px-3 py-1.5 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                : "rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
            }
          >
            {file.name}
            {isDirty ? <span aria-label="modified"> ●</span> : null}
          </button>
        );
      })}
    </div>
  );
}
