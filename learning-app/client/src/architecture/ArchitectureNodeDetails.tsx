import type { ArchitectureFile, IncludeGuard } from "@learning-app/shared";

interface ArchitectureNodeDetailsProps {
  file: ArchitectureFile | null;
  includeGuards: IncludeGuard[];
}

export function ArchitectureNodeDetails({
  file,
  includeGuards,
}: ArchitectureNodeDetailsProps) {
  if (!file) {
    return (
      <section className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Select a file to view its role and responsibility.
      </section>
    );
  }

  const guard = includeGuards.find((entry) => entry.fileId === file.fileId);

  return (
    <section
      aria-labelledby="node-details-heading"
      className="rounded-md border border-slate-200 bg-white p-4"
    >
      <h3 id="node-details-heading" className="text-lg font-semibold text-slate-900">
        {file.name}
      </h3>
      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="font-medium text-slate-500">Role</dt>
          <dd className="text-slate-800">{file.role}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Kind</dt>
          <dd className="text-slate-800">{file.kind}</dd>
        </div>
        {file.responsibility ? (
          <div>
            <dt className="font-medium text-slate-500">Responsibility</dt>
            <dd className="text-slate-800">{file.responsibility}</dd>
          </div>
        ) : null}
        {guard ? (
          <div>
            <dt className="font-medium text-slate-500">Include guard</dt>
            <dd className="font-mono text-slate-800">
              #ifndef {guard.macro} / #define {guard.macro}
            </dd>
          </div>
        ) : null}
        {file.role === "header" ? (
          <div>
            <dt className="font-medium text-slate-500">Public contract</dt>
            <dd className="text-slate-800">
              Headers declare the module interface. They are included into translation
              units and do not become independent object files.
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
