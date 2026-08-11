import { ArrayCell } from "./ArrayCell";
import type { ArrayCellState } from "../searching-sorting/trace-types";

interface ArrayVisualizerProps {
  cells: ArrayCellState[];
  reducedMotion?: boolean;
}

export function ArrayVisualizer({ cells, reducedMotion = false }: ArrayVisualizerProps) {
  return (
    <div
      role="list"
      aria-label="Array visualization"
      className="flex min-w-full gap-2 pb-2"
    >
      {cells.map((cell) => (
        <div key={cell.index} role="listitem">
          <ArrayCell
            index={cell.index}
            value={cell.value}
            role={cell.role}
            label={cell.label}
            reducedMotion={reducedMotion}
          />
        </div>
      ))}
    </div>
  );
}
