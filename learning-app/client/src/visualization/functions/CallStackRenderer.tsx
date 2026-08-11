import type { CallFrame, CallerVariable } from "./function-traces";

interface CallStackRendererProps {
  frames: CallFrame[];
  callerVars: CallerVariable[];
  activeFrameId: string | null;
  reducedMotion?: boolean;
}

export function CallStackRenderer({
  frames,
  callerVars,
  activeFrameId,
  reducedMotion = false,
}: CallStackRendererProps) {
  return (
    <div className="space-y-4">
      <section aria-labelledby="caller-vars-heading">
        <h3 id="caller-vars-heading" className="text-sm font-semibold text-slate-700">
          Caller variables
        </h3>
        <dl className="mt-2 flex flex-wrap gap-3">
          {callerVars.map((variable) => (
            <div
              key={variable.name}
              className="rounded-md border border-slate-300 bg-white px-3 py-2"
            >
              <dt className="text-xs font-medium uppercase text-slate-500">{variable.name}</dt>
              <dd className="font-mono text-sm font-semibold text-slate-900">
                {variable.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="call-frames-heading">
        <h3 id="call-frames-heading" className="text-sm font-semibold text-slate-700">
          Conceptual call frames
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          Teaching model only — not actual stack memory, registers, or ABI layout.
        </p>
        {frames.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No active call frames.</p>
        ) : (
          <ol
            className="mt-3 flex min-w-full flex-col-reverse gap-2 pb-2"
            aria-label="Conceptual call stack"
          >
            {frames.map((frame) => {
              const isActive = frame.id === activeFrameId;
              const statusLabel =
                frame.status === "returning"
                  ? "returning"
                  : frame.status === "returned"
                    ? "returned"
                    : isActive
                      ? "active"
                      : "waiting";

              return (
                <li
                  key={frame.id}
                  className={`rounded-md border px-4 py-3 ${
                    isActive || frame.status === "returning"
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-400 ring-offset-1"
                      : "border-slate-300 bg-white"
                  } ${reducedMotion ? "" : "transition-colors duration-200"}`}
                  aria-label={`${frame.functionName} frame, ${statusLabel}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-sm font-semibold text-slate-900">
                      {frame.functionName}()
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {statusLabel}
                      {frame.returnValue !== undefined ? ` → ${frame.returnValue}` : ""}
                    </span>
                  </div>
                  <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                    {frame.locals.map((local) => (
                      <div
                        key={local.name}
                        className="rounded border border-slate-200 bg-white px-2 py-1"
                      >
                        <dt className="text-xs text-slate-500">{local.name}</dt>
                        <dd className="font-mono text-sm text-slate-900">
                          {local.value ?? "—"}
                          {local.label ? (
                            <span className="ml-1 text-xs text-slate-600">({local.label})</span>
                          ) : null}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
