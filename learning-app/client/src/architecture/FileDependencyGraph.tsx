import type {
  ArchitectureFile,
  IncludeEdge,
  ModuleAnnotation,
} from "@learning-app/shared";

interface FileDependencyGraphProps {
  files: ArchitectureFile[];
  includes: IncludeEdge[];
  modules: ModuleAnnotation[];
  selectedFileId: string | null;
  onSelectFile: (fileId: string) => void;
}

function moduleForFile(
  modules: ModuleAnnotation[],
  fileId: string,
): ModuleAnnotation | undefined {
  return modules.find((module) => module.fileIds.includes(fileId));
}

export function FileDependencyGraph({
  files,
  includes,
  modules,
  selectedFileId,
  onSelectFile,
}: FileDependencyGraphProps) {
  const graphFiles = files.filter((file) => file.kind !== "resource");
  const width = 640;
  const height = Math.max(280, graphFiles.length * 72 + 40);
  const nodeWidth = 160;
  const nodeHeight = 56;

  const sourceFiles = graphFiles.filter((file) => file.kind === "source");
  const headerFiles = graphFiles.filter((file) => file.kind === "header");

  function nodePosition(index: number, column: number) {
    const x = column === 0 ? 40 : 400;
    const y = 40 + index * 80;
    return { x, y };
  }

  const positions = new Map<string, { x: number; y: number }>();
  sourceFiles.forEach((file, index) => {
    positions.set(file.fileId, nodePosition(index, 0));
  });
  headerFiles.forEach((file, index) => {
    positions.set(file.fileId, nodePosition(index, 1));
  });

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <svg
          role="img"
          aria-label="Project file dependency graph"
          viewBox={`0 0 ${width} ${height}`}
          className="min-w-[640px] rounded-md border border-slate-200 bg-slate-50"
        >
          <title>Project file dependency graph</title>
          {includes.map((edge) => {
            const from = positions.get(edge.fromFileId);
            const to = positions.get(edge.toFileId);
            if (!from || !to) {
              return null;
            }
            const x1 = from.x + nodeWidth;
            const y1 = from.y + nodeHeight / 2;
            const x2 = to.x;
            const y2 = to.y + nodeHeight / 2;
            return (
              <g key={`${edge.fromFileId}-${edge.toFileId}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#64748b"
                  strokeWidth={2}
                  markerEnd="url(#arrow)"
                />
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 - 6}
                  textAnchor="middle"
                  className="fill-slate-600 text-[10px]"
                >
                  {edge.includeName}
                </text>
              </g>
            );
          })}
          <defs>
            <marker
              id="arrow"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L6,3 L0,6 Z" fill="#64748b" />
            </marker>
          </defs>
          {graphFiles.map((file) => {
            const pos = positions.get(file.fileId);
            if (!pos) {
              return null;
            }
            const selected = selectedFileId === file.fileId;
            const module = moduleForFile(modules, file.fileId);
            return (
              <g key={file.fileId}>
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={nodeWidth}
                  height={nodeHeight}
                  rx={8}
                  fill={selected ? "#dbeafe" : "#ffffff"}
                  stroke={selected ? "#2563eb" : "#94a3b8"}
                  strokeWidth={selected ? 2 : 1}
                />
                <text
                  x={pos.x + nodeWidth / 2}
                  y={pos.y + 22}
                  textAnchor="middle"
                  className="fill-slate-900 text-xs font-semibold"
                >
                  {file.name}
                </text>
                <text
                  x={pos.x + nodeWidth / 2}
                  y={pos.y + 40}
                  textAnchor="middle"
                  className="fill-slate-600 text-[10px]"
                >
                  {file.role}
                  {module ? ` · ${module.label}` : ""}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <ul className="space-y-2 text-sm text-slate-700" aria-label="Include relationships">
        {includes.length === 0 ? (
          <li>No project header includes detected.</li>
        ) : (
          includes.map((edge) => {
            const from = files.find((file) => file.fileId === edge.fromFileId);
            const to = files.find((file) => file.fileId === edge.toFileId);
            return (
              <li key={`${edge.fromFileId}-${edge.toFileId}`}>
                <span className="font-medium">{from?.name ?? edge.fromFileId}</span>
                {" includes "}
                <span className="font-medium">{edge.includeName}</span>
                {" → "}
                <span className="font-medium">{to?.name ?? edge.toFileId}</span>
              </li>
            );
          })
        )}
      </ul>

      <div
        role="listbox"
        aria-label="Select a project file"
        className="flex flex-wrap gap-2"
      >
        {graphFiles.map((file) => (
          <button
            key={file.fileId}
            type="button"
            role="option"
            aria-selected={selectedFileId === file.fileId}
            onClick={() => onSelectFile(file.fileId)}
            className={`rounded-md border px-3 py-1.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
              selectedFileId === file.fileId
                ? "border-blue-600 bg-blue-50 text-blue-900"
                : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
            }`}
          >
            {file.name}
          </button>
        ))}
      </div>
    </div>
  );
}
