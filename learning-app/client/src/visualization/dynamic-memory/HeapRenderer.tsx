import { MemoryCell } from "../memory/MemoryCell";
import { MemoryLegend } from "../memory/MemoryLegend";
import { UndefinedBehaviorNotice } from "../memory/UndefinedBehaviorNotice";
import type { HeapStep } from "./heap-traces";

interface HeapRendererProps {
  step: HeapStep;
}

const LIFETIME_LABELS = {
  live: "live",
  freed: "freed — lifetime ended",
  leaked: "leaked — no owner",
};

export function HeapRenderer({ step }: HeapRendererProps) {
  return (
    <div className="space-y-4">
      {step.leakWarning ? (
        <div
          role="alert"
          className="rounded-md border border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-900"
        >
          <p className="font-semibold">MEMORY LEAK</p>
          <p className="mt-1">
            A live allocation has no pointer retaining its address. This is an educational
            counterexample — real programs lose the ability to free that memory.
          </p>
        </div>
      ) : null}

      {step.undefinedBehavior ? (
        <UndefinedBehaviorNotice state={step.undefinedBehavior} />
      ) : null}

      <section aria-labelledby="heap-pointers-heading">
        <h3 id="heap-pointers-heading" className="text-sm font-semibold text-slate-700">
          Pointer variables
        </h3>
        <div className="mt-2 flex flex-wrap gap-3">
          {step.pointers.map((pointer) => (
            <MemoryCell
              key={pointer.id}
              name={pointer.name}
              type={pointer.type}
              addressSlot={pointer.addressSlot}
              value={null}
              valueState={pointer.isDangling ? "invalid" : "initialized"}
              valueLabel={
                pointer.isNull
                  ? "NULL"
                  : pointer.isDangling
                    ? `→ ${pointer.pointsToLabel} (dangling)`
                    : `→ ${pointer.pointsToLabel}`
              }
              highlight={step.activeIds.includes(pointer.id)}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="heap-allocations-heading">
        <h3 id="heap-allocations-heading" className="text-sm font-semibold text-slate-700">
          Conceptual heap allocations
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          Teaching model only — not a real allocator or garbage collector.
        </p>
        <div className="mt-3 flex min-w-full flex-wrap gap-4 pb-2">
          {step.allocations.map((allocation) => (
            <div
              key={allocation.id}
              className={`min-w-[12rem] rounded-md border p-3 ${
                step.activeIds.includes(allocation.id)
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-400 ring-offset-1"
                  : allocation.lifetime === "leaked"
                    ? "border-orange-400 bg-orange-50"
                    : allocation.lifetime === "freed"
                      ? "border-slate-400 bg-slate-100"
                      : "border-green-400 bg-green-50"
              }`}
              aria-label={`${allocation.label}, ${LIFETIME_LABELS[allocation.lifetime]}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-900">{allocation.label}</span>
                <span className="rounded bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
                  {LIFETIME_LABELS[allocation.lifetime]}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {allocation.values.map((value, index) => (
                  <div
                    key={`${allocation.id}-${index}`}
                    className="rounded border border-slate-200 bg-white px-2 py-1 text-center"
                  >
                    <div className="text-xs text-slate-500">[{index}]</div>
                    <div className="font-mono text-sm">
                      {allocation.valueStates[index] === "uninitialized"
                        ? "?"
                        : allocation.valueStates[index] === "invalid"
                          ? "—"
                          : value}
                    </div>
                    <div className="text-xs text-slate-500">
                      {allocation.valueStates[index] === "uninitialized"
                        ? "uninitialized"
                        : allocation.valueStates[index] === "zero"
                          ? "zero"
                          : allocation.valueStates[index] === "invalid"
                            ? "invalid"
                            : "initialized"}
                    </div>
                  </div>
                ))}
              </div>
              {allocation.ownerPointerIds.length > 0 ? (
                <p className="mt-2 text-xs text-slate-700">
                  Owned by: {allocation.ownerPointerIds.join(", ")}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <MemoryLegend />
    </div>
  );
}
