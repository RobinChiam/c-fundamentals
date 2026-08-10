import type { CompilerDiagnostic } from "@learning-app/shared";

interface CompilerDiagnosticsProps {
  diagnostics: CompilerDiagnostic[];
}

export function CompilerDiagnostics({ diagnostics }: CompilerDiagnosticsProps) {
  if (diagnostics.length === 0) {
    return (
      <p className="text-sm text-slate-600">No structured diagnostics were parsed.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {diagnostics.map((diagnostic, index) => (
        <li
          key={`${diagnostic.fileName ?? "unknown"}-${diagnostic.line ?? 0}-${index}`}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium capitalize text-slate-900">
              {diagnostic.severity}
            </span>
            {diagnostic.fileName ? (
              <span className="text-slate-700">{diagnostic.fileName}</span>
            ) : null}
            {diagnostic.line ? (
              <span className="text-slate-500">
                line {diagnostic.line}
                {diagnostic.column ? `, column ${diagnostic.column}` : ""}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-slate-800">{diagnostic.message}</p>
        </li>
      ))}
    </ul>
  );
}
