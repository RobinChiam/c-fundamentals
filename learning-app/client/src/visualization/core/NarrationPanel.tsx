interface NarrationPanelProps {
  narration: string;
}

export function NarrationPanel({ narration }: NarrationPanelProps) {
  return (
    <section
      aria-labelledby="narration-heading"
      className="rounded-md border border-slate-200 bg-slate-50 p-4"
    >
      <h3 id="narration-heading" className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Narration
      </h3>
      <p aria-live="polite" className="mt-2 text-sm leading-relaxed text-slate-800">
        {narration}
      </p>
    </section>
  );
}
