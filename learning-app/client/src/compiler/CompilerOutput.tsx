interface CompilerOutputProps {
  stdout: string;
  stderr: string;
  stdoutTruncated: boolean;
  stderrTruncated: boolean;
}

export function CompilerOutput({
  stdout,
  stderr,
  stdoutTruncated,
  stderrTruncated,
}: CompilerOutputProps) {
  const combined = [stdout, stderr].filter(Boolean).join("\n");

  return (
    <details className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <summary className="cursor-pointer text-sm font-medium text-slate-800">
        Raw compiler output
      </summary>
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-slate-800">
        {combined || "No compiler output captured."}
      </pre>
      {stdoutTruncated || stderrTruncated ? (
        <p className="mt-2 text-xs text-amber-700">
          Compiler output was truncated to remain within server limits.
        </p>
      ) : null}
    </details>
  );
}
