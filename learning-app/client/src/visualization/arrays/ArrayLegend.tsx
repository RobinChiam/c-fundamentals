const LEGEND_ITEMS = [
  { role: "Current", description: "Active index being examined" },
  { role: "Comparing", description: "Values being compared" },
  { role: "Match", description: "Target found" },
  { role: "Excluded", description: "Discarded from search range" },
  { role: "In range", description: "Current binary search range" },
  { role: "Key", description: "Insertion sort key element" },
  { role: "Sorted", description: "Sorted portion of the array" },
  { role: "Swapping", description: "Adjacent swap in progress" },
] as const;

export function ArrayLegend() {
  return (
    <section aria-labelledby="legend-heading" className="rounded-md border border-slate-200 p-3">
      <h3 id="legend-heading" className="text-sm font-semibold text-slate-700">
        Legend
      </h3>
      <ul className="mt-2 grid gap-1 sm:grid-cols-2">
        {LEGEND_ITEMS.map((item) => (
          <li key={item.role} className="text-xs text-slate-600">
            <span className="font-semibold text-slate-800">{item.role}:</span>{" "}
            {item.description}
          </li>
        ))}
      </ul>
    </section>
  );
}
