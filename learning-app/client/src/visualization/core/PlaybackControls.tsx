import type { PlaybackSpeed } from "./visualization-types";

interface PlaybackControlsProps {
  playing: boolean;
  canPlay: boolean;
  speed: PlaybackSpeed;
  onReset: () => void;
  onPrevious: () => void;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onEnd: () => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
}

const SPEED_OPTIONS: PlaybackSpeed[] = [0.5, 1, 1.5, 2];

export function PlaybackControls({
  playing,
  canPlay,
  speed,
  onReset,
  onPrevious,
  onPlay,
  onPause,
  onNext,
  onEnd,
  onSpeedChange,
}: PlaybackControlsProps) {
  return (
    <div
      role="group"
      aria-label="Playback controls"
      className="flex flex-wrap items-center gap-2"
    >
      <button
        type="button"
        onClick={onReset}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        Reset
      </button>
      <button
        type="button"
        onClick={onPrevious}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        Previous
      </button>
      {playing ? (
        <button
          type="button"
          onClick={onPause}
          className="rounded-md border border-blue-600 bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Pause
        </button>
      ) : (
        <button
          type="button"
          onClick={onPlay}
          disabled={!canPlay}
          className="rounded-md border border-blue-600 bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Play
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        Next
      </button>
      <button
        type="button"
        onClick={onEnd}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        End
      </button>
      <label className="ml-2 flex items-center gap-2 text-sm text-slate-700">
        <span>Speed</span>
        <select
          value={speed}
          onChange={(event) =>
            onSpeedChange(Number(event.target.value) as PlaybackSpeed)
          }
          className="rounded-md border border-slate-300 bg-white px-2 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          aria-label="Playback speed"
        >
          {SPEED_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}x
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
