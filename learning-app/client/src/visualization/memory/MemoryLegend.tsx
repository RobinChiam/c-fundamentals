export function MemoryLegend() {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
      <p className="font-semibold text-slate-900">Legend</p>
      <ul className="mt-2 list-disc space-y-1 pl-4">
        <li>
          <span className="font-mono text-amber-800">sim 0x…</span> — simulated address
          (not a real process address)
        </li>
        <li>
          <span className="font-semibold">?</span> — uninitialized / indeterminate storage
        </li>
        <li>Blue highlight — currently active in this step</li>
        <li>Text labels describe pointer relationships (not color alone)</li>
      </ul>
    </div>
  );
}
