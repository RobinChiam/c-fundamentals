import { formatSimulatedAddress } from "./simulated-addresses";
import type { MemoryValueState } from "./memory-types";

interface MemoryCellProps {
  name: string;
  type: string;
  addressSlot: number;
  value: number | null;
  valueState: MemoryValueState;
  valueLabel?: string;
  highlight?: boolean;
}

const VALUE_STATE_LABELS: Record<MemoryValueState, string> = {
  initialized: "initialized",
  uninitialized: "uninitialized / indeterminate",
  zero: "zero-initialized",
  invalid: "invalid",
};

export function MemoryCell({
  name,
  type,
  addressSlot,
  value,
  valueState,
  valueLabel,
  highlight = false,
}: MemoryCellProps) {
  const displayValue =
    valueLabel ??
    (valueState === "uninitialized"
      ? "?"
      : valueState === "invalid"
        ? "—"
        : value === null
          ? "NULL"
          : String(value));

  return (
    <div
      className={`min-w-[7rem] rounded-md border px-3 py-2 ${
        highlight
          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-400 ring-offset-1"
          : "border-slate-300 bg-white"
      }`}
      aria-label={`${name}: ${displayValue}, ${VALUE_STATE_LABELS[valueState]}, simulated address ${formatSimulatedAddress(addressSlot)}`}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {name}
      </div>
      <div className="font-mono text-sm text-slate-900">{displayValue}</div>
      <div className="mt-1 text-xs text-slate-600">{type}</div>
      <div className="mt-1 font-mono text-xs text-amber-800">
        sim {formatSimulatedAddress(addressSlot)}
      </div>
      <div className="mt-1 text-xs text-slate-500">{VALUE_STATE_LABELS[valueState]}</div>
    </div>
  );
}
