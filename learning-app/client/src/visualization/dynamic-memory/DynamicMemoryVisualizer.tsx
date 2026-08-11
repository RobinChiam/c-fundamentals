import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ConceptualModelNotice } from "../core/ConceptualModelNotice";
import { MetricsPanel } from "../core/MetricsPanel";
import { NarrationPanel } from "../core/NarrationPanel";
import { PlaybackControls } from "../core/PlaybackControls";
import { StepCounter } from "../core/StepCounter";
import { usePlayback } from "../core/usePlayback";
import { VisualizationShell } from "../core/VisualizationShell";
import { HeapRenderer } from "./HeapRenderer";
import {
  HEAP_SCENARIO_OPTIONS,
  createHeapTrace,
  heapStepMetrics,
  type HeapScenarioId,
} from "./heap-traces";

export function DynamicMemoryVisualizer() {
  const [scenarioId, setScenarioId] = useState<HeapScenarioId>("malloc-init-free");

  const trace = useMemo(() => createHeapTrace(scenarioId), [scenarioId]);
  const playback = usePlayback(trace.steps.length);
  const { reset } = playback;
  const currentStep = trace.steps[playback.stepIndex];

  useEffect(() => {
    reset();
  }, [scenarioId, reset]);

  return (
    <VisualizationShell
      title="Dynamic Memory Explorer"
      notice={<ConceptualModelNotice showSimulatedAddresses />}
      controls={
        <fieldset>
          <legend className="text-sm font-semibold text-slate-700">Scenario</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {HEAP_SCENARIO_OPTIONS.map((option) => (
              <label
                key={option.id}
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
              >
                <input
                  type="radio"
                  name="heap-scenario"
                  value={option.id}
                  checked={scenarioId === option.id}
                  onChange={() => setScenarioId(option.id)}
                  className="h-4 w-4"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
      }
      playback={
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
      }
      stepCounter={
        <StepCounter
          currentStep={trace.steps.length === 0 ? 0 : playback.stepIndex + 1}
          totalSteps={Math.max(trace.steps.length, 1)}
        />
      }
      visualization={currentStep ? <HeapRenderer step={currentStep} /> : null}
      narration={<NarrationPanel narration={currentStep?.narration ?? ""} />}
      metrics={<MetricsPanel metrics={currentStep ? heapStepMetrics(currentStep) : []} />}
      complexity={
        <section className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p>
            <Link
              to="/lessons/dynamic-memory-allocation"
              className="font-medium text-blue-700 hover:text-blue-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Return to Dynamic Memory Allocation lesson
            </Link>
          </p>
        </section>
      }
    />
  );
}
