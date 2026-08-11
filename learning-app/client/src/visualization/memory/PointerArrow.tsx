interface PointerArrowProps {
  fromLabel: string;
  toLabel: string;
  textEquivalent: string;
  highlight?: boolean;
}

export function PointerArrow({
  fromLabel,
  toLabel,
  textEquivalent,
  highlight = false,
}: PointerArrowProps) {
  return (
    <div className="flex flex-col items-center gap-1 px-2" aria-label={textEquivalent}>
      <svg
        width="80"
        height="32"
        viewBox="0 0 80 32"
        role="img"
        aria-hidden="true"
        className={highlight ? "text-blue-600" : "text-slate-600"}
      >
        <title>{textEquivalent}</title>
        <line x1="4" y1="16" x2="64" y2="16" stroke="currentColor" strokeWidth="2" />
        <polygon points="64,16 56,11 56,21" fill="currentColor" />
      </svg>
      <span className="text-xs font-medium text-slate-700">{textEquivalent}</span>
      <span className="sr-only">
        {fromLabel} points to {toLabel}
      </span>
    </div>
  );
}
