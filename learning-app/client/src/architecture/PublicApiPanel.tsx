import type { ModuleAnnotation } from "@learning-app/shared";

interface PublicApiPanelProps {
  modules: ModuleAnnotation[];
}

export function PublicApiPanel({ modules }: PublicApiPanelProps) {
  return (
    <div className="space-y-4">
      {modules.map((module) => (
        <section
          key={module.id}
          aria-labelledby={`api-${module.id}`}
          className="rounded-md border border-slate-200 bg-white p-4"
        >
          <h3 id={`api-${module.id}`} className="text-lg font-semibold text-slate-900">
            {module.label}
          </h3>
          <p className="mt-1 text-sm text-slate-600">{module.responsibility}</p>
          <h4 className="mt-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Public concepts
          </h4>
          <ul className="mt-2 flex flex-wrap gap-2">
            {module.publicConcepts.map((concept) => (
              <li
                key={concept}
                className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs text-slate-800"
              >
                {concept}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
