import type { ReactNode } from "react";

interface VisualizationShellProps {
  title: string;
  notice: ReactNode;
  controls: ReactNode;
  playback: ReactNode;
  stepCounter: ReactNode;
  visualization: ReactNode;
  narration: ReactNode;
  metrics: ReactNode;
  complexity: ReactNode;
}

export function VisualizationShell({
  title,
  notice,
  controls,
  playback,
  stepCounter,
  visualization,
  narration,
  metrics,
  complexity,
}: VisualizationShellProps) {
  return (
    <section
      aria-labelledby="visualizer-title"
      className="space-y-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <header className="space-y-3">
        <h2 id="visualizer-title" className="text-2xl font-bold text-slate-900">
          {title}
        </h2>
        <div
          role="note"
          className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {notice}
        </div>
      </header>

      <div className="space-y-4">{controls}</div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {playback}
        {stepCounter}
      </div>
      <div className="overflow-x-auto">{visualization}</div>
      <div className="grid gap-4 lg:grid-cols-2">
        {narration}
        {metrics}
      </div>
      {complexity}
    </section>
  );
}
