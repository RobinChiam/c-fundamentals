interface MetricEntry {
  label: string;
  value: string | number;
}

interface MetricsPanelProps {
  metrics: MetricEntry[];
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  return (
    <section
      aria-labelledby="metrics-heading"
      className="rounded-md border border-slate-200 bg-slate-50 p-4"
    >
      <h3 id="metrics-heading" className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Metrics
      </h3>
      <dl className="mt-2 grid gap-2 sm:grid-cols-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded border border-slate-200 bg-white px-3 py-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {metric.label}
            </dt>
            <dd className="text-sm font-semibold text-slate-900">{metric.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
