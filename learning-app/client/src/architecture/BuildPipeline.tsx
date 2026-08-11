import { useMemo } from "react";
import type { ArchitectureBuildSpec, BuildPipelineStage } from "@learning-app/shared";
import { PlaybackControls } from "../visualization/core/PlaybackControls";
import { NarrationPanel } from "../visualization/core/NarrationPanel";
import { StepCounter } from "../visualization/core/StepCounter";
import { usePlayback } from "../visualization/core/usePlayback";

interface BuildPipelineProps {
  build: ArchitectureBuildSpec;
  stages: BuildPipelineStage[];
}

export function BuildPipeline({ build, stages }: BuildPipelineProps) {
  const playback = usePlayback(stages.length);
  const currentStage = stages[playback.stepIndex];

  const summary = useMemo(
    () =>
      [
        ...build.translationUnits.map((unit) => unit.objectFileLabel),
        ...build.linkFlags,
        build.outputLabel,
      ].join(" + "),
    [build],
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-700">
        Simplified build model: source/includes → translation unit → object → link →
        executable. This is conceptual teaching — not an exact GCC phase dump.
      </p>

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
          totalSteps={stages.length}
        />
      </div>

      {currentStage ? (
        <section
          aria-labelledby="pipeline-stage-heading"
          className="rounded-md border border-slate-200 bg-white p-4"
        >
          <h3
            id="pipeline-stage-heading"
            className="text-lg font-semibold text-slate-900"
          >
            {currentStage.label}
          </h3>
          <ul className="mt-3 space-y-1 text-sm text-slate-700">
            {currentStage.highlights.map((highlight) => (
              <li key={highlight}>
                <span className="font-mono">{highlight}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <NarrationPanel narration={currentStage?.narration ?? ""} />

      <p className="text-sm text-slate-600">
        Conceptual link step:{" "}
        <span className="font-mono">{summary}</span>
      </p>
    </div>
  );
}
