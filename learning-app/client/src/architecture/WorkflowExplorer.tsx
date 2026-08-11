import { useMemo, useState } from "react";
import type { ArchitectureWorkflow } from "@learning-app/shared";
import { PlaybackControls } from "../visualization/core/PlaybackControls";
import { NarrationPanel } from "../visualization/core/NarrationPanel";
import { StepCounter } from "../visualization/core/StepCounter";
import { usePlayback } from "../visualization/core/usePlayback";

interface WorkflowExplorerProps {
  workflows: ArchitectureWorkflow[];
}

export function WorkflowExplorer({ workflows }: WorkflowExplorerProps) {
  const [activeWorkflowId, setActiveWorkflowId] = useState(workflows[0]?.id ?? "");
  const activeWorkflow =
    workflows.find((workflow) => workflow.id === activeWorkflowId) ?? workflows[0];
  const playback = usePlayback(activeWorkflow?.steps.length ?? 0);

  const currentStep = useMemo(
    () => activeWorkflow?.steps[playback.stepIndex],
    [activeWorkflow, playback.stepIndex],
  );

  if (!activeWorkflow) {
    return null;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-700">
        Architecture traces show how modules collaborate in the curriculum design.
        They do not trace actual runtime execution of your program.
      </p>

      <div
        role="tablist"
        aria-label="Runtime workflows"
        className="flex flex-wrap gap-2"
      >
        {workflows.map((workflow) => (
          <button
            key={workflow.id}
            type="button"
            role="tab"
            aria-selected={workflow.id === activeWorkflow.id}
            onClick={() => {
              setActiveWorkflowId(workflow.id);
              playback.reset();
            }}
            className={`rounded-md border px-3 py-1.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
              workflow.id === activeWorkflow.id
                ? "border-blue-600 bg-blue-50 text-blue-900"
                : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
            }`}
          >
            {workflow.title}
          </button>
        ))}
      </div>

      {activeWorkflow.moduleCollaborationNote ? (
        <p className="text-sm text-slate-600">{activeWorkflow.moduleCollaborationNote}</p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <PlaybackControls
          playing={playback.playing}
          canPlay={playback.stepIndex < playback.maxIndex}
          speed={playback.speed}
          onReset={playback.reset}
          onPrevious={playback.previous}
          onPlay={playback.play}
          onPause={playback.pause}
          onNext={playback.next}
          onEnd={playback.end}
          onSpeedChange={playback.setSpeed}
        />
        <StepCounter
          currentStep={playback.stepIndex + 1}
          totalSteps={activeWorkflow.steps.length}
        />
      </div>

      {currentStep ? (
        <section className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="text-lg font-semibold text-slate-900">{currentStep.label}</h3>
          <dl className="mt-2 space-y-1 text-sm text-slate-700">
            {currentStep.moduleId ? (
              <div>
                <dt className="inline font-medium">Module: </dt>
                <dd className="inline uppercase">{currentStep.moduleId}</dd>
              </div>
            ) : null}
            {currentStep.symbol ? (
              <div>
                <dt className="inline font-medium">Symbol: </dt>
                <dd className="inline font-mono">{currentStep.symbol}</dd>
              </div>
            ) : null}
            {currentStep.resourceId ? (
              <div>
                <dt className="inline font-medium">Resource: </dt>
                <dd className="inline">{currentStep.resourceId}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      <NarrationPanel narration={currentStep?.narration ?? ""} />
    </div>
  );
}
