import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ConceptualModelNotice } from "../core/ConceptualModelNotice";
import { MetricsPanel } from "../core/MetricsPanel";
import { NarrationPanel } from "../core/NarrationPanel";
import { PlaybackControls } from "../core/PlaybackControls";
import { StepCounter } from "../core/StepCounter";
import { usePlayback } from "../core/usePlayback";
import { usePrefersReducedMotion } from "../core/usePrefersReducedMotion";
import { VisualizationShell } from "../core/VisualizationShell";
import { PointerMemoryRenderer } from "./PointerMemoryRenderer";
import {
  POINTER_SCENARIO_OPTIONS,
  createPointerTrace,
  pointerStepMetrics,
  type PointerScenarioId,
} from "./pointer-traces";

export function PointerVisualizer() {
  const [scenarioId, setScenarioId] = useState<PointerScenarioId>("address-dereference");
  const reducedMotion = usePrefersReducedMotion();

  const trace = useMemo(() => createPointerTrace(scenarioId), [scenarioId]);
  const playback = usePlayback(trace.steps.length);
  const { reset } = playback;
  const currentStep = trace.steps[playback.stepIndex];

  useEffect(() => {
    reset();
  }, [scenarioId, reset]);

  return (
    <VisualizationShell
      title="Pointer & Memory Explorer"
      notice={<ConceptualModelNotice showSimulatedAddresses />}
      controls={
        <fieldset>
          <legend className="text-sm font-semibold text-slate-700">Scenario</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {POINTER_SCENARIO_OPTIONS.map((option) => (
              <label
                key={option.id}
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
              >
                <input
                  type="radio"
                  name="pointer-scenario"
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
      visualization={
        currentStep ? (
          <PointerMemoryRenderer step={currentStep} reducedMotion={reducedMotion} />
        ) : null
      }
      narration={<NarrationPanel narration={currentStep?.narration ?? ""} />}
      metrics={
        <MetricsPanel metrics={currentStep ? pointerStepMetrics(currentStep) : []} />
      }
      complexity={
        <section className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p>
            <Link
              to="/lessons/pointers"
              className="font-medium text-blue-700 hover:text-blue-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Return to Pointers lesson
            </Link>
          </p>
        </section>
      }
    />
  );
}
