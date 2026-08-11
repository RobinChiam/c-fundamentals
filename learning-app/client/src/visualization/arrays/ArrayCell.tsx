import type { ArrayCellRole } from "../searching-sorting/trace-types";

const ROLE_LABELS: Record<ArrayCellRole, string> = {
  default: "",
  active: "Current",
  comparing: "Comparing",
  matched: "Match",
  excluded: "Excluded",
  sorted: "Sorted",
  swapping: "Swapping",
  key: "Key",
  range: "In range",
};

interface ArrayCellProps {
  index: number;
  value: number;
  role: ArrayCellRole;
  label?: string;
  reducedMotion?: boolean;
}

function roleClasses(role: ArrayCellRole): string {
  switch (role) {
    case "active":
      return "border-blue-600 ring-2 ring-blue-300 bg-blue-50";
    case "comparing":
      return "border-amber-500 ring-2 ring-amber-200 bg-amber-50";
    case "matched":
      return "border-green-600 ring-2 ring-green-300 bg-green-50";
    case "excluded":
      return "border-slate-300 bg-slate-100 text-slate-500 opacity-60";
    case "sorted":
      return "border-emerald-600 bg-emerald-50";
    case "swapping":
      return "border-purple-600 ring-2 ring-purple-300 bg-purple-50";
    case "key":
      return "border-indigo-600 ring-2 ring-indigo-300 bg-indigo-50";
    case "range":
      return "border-cyan-600 bg-cyan-50";
    default:
      return "border-slate-300 bg-white";
  }
}

export function ArrayCell({
  index,
  value,
  role,
  label,
  reducedMotion = false,
}: ArrayCellProps) {
  const roleLabel = label ?? ROLE_LABELS[role];
  const motionClass = reducedMotion ? "" : "transition-colors duration-200";

  return (
    <div className="flex min-w-[3.5rem] flex-col items-center gap-1">
      <div
        className={`flex h-14 w-14 flex-col items-center justify-center rounded-md border-2 px-1 text-center ${roleClasses(role)} ${motionClass}`}
        aria-label={`Index ${index}, value ${value}${roleLabel ? `, ${roleLabel}` : ""}`}
      >
        <span className="text-lg font-semibold tabular-nums">{value}</span>
        {roleLabel ? (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-700">
            {roleLabel}
          </span>
        ) : null}
      </div>
      <span className="text-xs font-medium text-slate-500">[{index}]</span>
    </div>
  );
}
