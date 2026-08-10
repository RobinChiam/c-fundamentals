import type { LessonFileDescriptor } from "@learning-app/shared";
import { getEditableDescriptors } from "../../workspace/workspace-loader";
import {
  useLessonWorkspaceActions,
  useLessonWorkspaceEntry,
  useWorkspaceContext,
} from "../../workspace/WorkspaceProvider";
import { getActiveFile } from "../../workspace/workspace-selectors";
import { ErrorState } from "../ErrorState";
import { LoadingState } from "../LoadingState";
import { MonacoCodeEditor } from "./MonacoCodeEditor";
import { MonacoDiffViewer } from "./MonacoDiffViewer";
import { WorkspaceTabs } from "./WorkspaceTabs";
import { WorkspaceToolbar } from "./WorkspaceToolbar";
import { RunPanel } from "../../runner/RunPanel";

interface CodeWorkspaceProps {
  lessonId: string;
  files: LessonFileDescriptor[];
}

export function CodeWorkspace({ lessonId, files }: CodeWorkspaceProps) {
  const editableFiles = getEditableDescriptors(files);
  const entry = useLessonWorkspaceEntry(lessonId, files);
  const { retryWorkspaceLoad } = useWorkspaceContext();
  const actions = useLessonWorkspaceActions(lessonId);

  if (editableFiles.length === 0) {
    return null;
  }

  if (entry.status === "idle" || entry.status === "loading") {
    return (
      <section aria-label="Code workspace" className="mt-10">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Code workspace</h2>
        <LoadingState message="Loading code workspace…" />
      </section>
    );
  }

  if (entry.status === "error") {
    return (
      <section aria-label="Code workspace" className="mt-10">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Code workspace</h2>
        <ErrorState
          message={entry.message}
          onRetry={() => retryWorkspaceLoad(lessonId, files)}
        />
      </section>
    );
  }

  const workspace = entry.workspace;
  const activeFile = getActiveFile(workspace);

  if (!activeFile) {
    return (
      <section aria-label="Code workspace" className="mt-10">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Code workspace</h2>
        <ErrorState message="Unable to load code workspace" />
      </section>
    );
  }

  const handleResetWorkspace = () => {
    if (
      window.confirm(
        "Reset all files in this lesson workspace to the repository originals?",
      )
    ) {
      actions.resetWorkspace();
    }
  };

  const handleCopyDraft = async () => {
    try {
      await navigator.clipboard.writeText(activeFile.draftContent);
    } catch {
      // Clipboard failures should not break the editor.
    }
  };

  return (
    <section aria-label="Code workspace" className="mt-10">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Code workspace</h2>

      <WorkspaceToolbar
        workspace={workspace}
        activeFile={activeFile}
        onResetFile={() => actions.resetFile(activeFile.id)}
        onResetWorkspace={handleResetWorkspace}
        onSetViewMode={actions.setViewMode}
        onCopyDraft={() => {
          void handleCopyDraft();
        }}
      />

      <WorkspaceTabs
        workspace={workspace}
        onSelectFile={actions.selectFile}
      />

      <div
        id={`workspace-panel-${activeFile.id}`}
        role="tabpanel"
        aria-labelledby={`workspace-tab-${activeFile.id}`}
        className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950"
      >
        <div className="border-b border-slate-800 px-4 py-2 text-sm text-slate-300">
          {activeFile.name}
        </div>
        {workspace.viewMode === "edit" ? (
          <MonacoCodeEditor
            value={activeFile.draftContent}
            onChange={(content) => actions.updateDraft(activeFile.id, content)}
          />
        ) : (
          <MonacoDiffViewer
            original={activeFile.originalContent}
            modified={activeFile.draftContent}
          />
        )}
      </div>

      <RunPanel lessonId={lessonId} workspace={workspace} />
    </section>
  );
}
