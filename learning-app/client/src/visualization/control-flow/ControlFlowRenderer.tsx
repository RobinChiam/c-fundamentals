import type { ControlFlowStep, FlowEdge, FlowNode } from "./control-flow-traces";

interface ControlFlowRendererProps {
  step: ControlFlowStep;
  reducedMotion?: boolean;
}

const NODE_KIND_LABELS: Record<FlowNode["kind"], string> = {
  init: "Init",
  condition: "Condition",
  body: "Body",
  update: "Update",
  continue: "Continue",
  break: "Break",
  exit: "Exit",
  input: "Input",
};

function nodePosition(index: number, total: number): { x: number; y: number } {
  const spacing = 120;
  const x = 20 + index * spacing;
  const y = index % 2 === 0 ? 40 : 100;
  if (total <= 3) {
    return { x: 20 + index * 140, y: 60 };
  }
  return { x, y };
}

function buildPositions(nodes: FlowNode[]): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  nodes.forEach((node, index) => {
    positions.set(node.id, nodePosition(index, nodes.length));
  });
  return positions;
}

function EdgeLine({
  edge,
  positions,
  active,
}: {
  edge: FlowEdge;
  positions: Map<string, { x: number; y: number }>;
  active: boolean;
}) {
  const from = positions.get(edge.from);
  const to = positions.get(edge.to);
  if (!from || !to) return null;

  const midX = (from.x + to.x) / 2 + 50;
  const midY = (from.y + to.y) / 2 + 20;
  const text = edge.label ? `${edge.label}` : "flow";

  return (
    <g aria-label={active ? `Active edge: ${text}` : `Edge: ${text}`}>
      <line
        x1={from.x + 90}
        y1={from.y + 30}
        x2={to.x + 10}
        y2={to.y + 30}
        stroke={active ? "#2563eb" : "#64748b"}
        strokeWidth={active ? 3 : 2}
        strokeDasharray={active ? undefined : "4 2"}
        markerEnd="url(#arrowhead)"
      />
      {edge.label ? (
        <text x={midX} y={midY} className="fill-slate-700 text-[10px]">
          {edge.label}
          {active ? " (active)" : ""}
        </text>
      ) : null}
    </g>
  );
}

export function ControlFlowRenderer({ step, reducedMotion = false }: ControlFlowRendererProps) {
  const positions = buildPositions(step.nodes);
  const width = Math.max(400, step.nodes.length * 130 + 40);
  const activeNode = step.nodes.find((node) => node.id === step.activeNodeId);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-2">
        <svg
          width={width}
          height={160}
          role="img"
          aria-label={`Control flow diagram. Active node: ${activeNode?.label ?? "none"}`}
          className={reducedMotion ? "" : "transition-opacity duration-200"}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#64748b" />
            </marker>
          </defs>
          {step.edges.map((edge) => (
            <EdgeLine
              key={edge.id}
              edge={edge}
              positions={positions}
              active={edge.id === step.activeEdgeId}
            />
          ))}
          {step.nodes.map((node) => {
            const pos = positions.get(node.id)!;
            const isActive = node.id === step.activeNodeId;
            return (
              <g key={node.id}>
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={100}
                  height={56}
                  rx={6}
                  fill={isActive ? "#dbeafe" : "#ffffff"}
                  stroke={isActive ? "#2563eb" : "#94a3b8"}
                  strokeWidth={isActive ? 3 : 1.5}
                />
                <text
                  x={pos.x + 50}
                  y={pos.y + 18}
                  textAnchor="middle"
                  className="fill-slate-500 text-[9px] font-semibold uppercase"
                >
                  {NODE_KIND_LABELS[node.kind]}
                  {isActive ? " • active" : ""}
                </text>
                <text
                  x={pos.x + 50}
                  y={pos.y + 36}
                  textAnchor="middle"
                  className="fill-slate-900 text-[10px]"
                >
                  {node.label.length > 16 ? `${node.label.slice(0, 14)}…` : node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
        <p>
          <span className="font-semibold">Active node:</span> {activeNode?.label ?? "none"}
        </p>
        {step.activeEdgeId ? (
          <p className="mt-1">
            <span className="font-semibold">Active transition:</span>{" "}
            {step.edges.find((edge) => edge.id === step.activeEdgeId)?.label ?? step.activeEdgeId}
          </p>
        ) : null}
        {step.stopped ? (
          <p className="mt-2 font-medium text-red-800">
            Stopped: invalid index would be accessed — no fabricated memory read.
          </p>
        ) : null}
      </div>
    </div>
  );
}
