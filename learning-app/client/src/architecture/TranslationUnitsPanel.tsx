import type { TranslationUnit } from "@learning-app/shared";

interface TranslationUnitsPanelProps {
  translationUnits: TranslationUnit[];
}

export function TranslationUnitsPanel({
  translationUnits,
}: TranslationUnitsPanelProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-700">
        One <code className="rounded bg-slate-100 px-1">.c</code> file plus the
        contents of headers it includes forms one translation unit, which compiles to
        one object file. Headers participate through inclusion — they do not become
        separate object files.
      </p>
      <ul className="space-y-3">
        {translationUnits.map((unit) => (
          <li
            key={unit.sourceFileId}
            className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-800"
          >
            <p className="font-medium">
              {unit.sourceFileName}
              {unit.includedHeaderFileIds.length > 0
                ? ` + included header(s)`
                : ""}
              {" → "}
              <span className="font-mono">{unit.objectFileLabel}</span>
            </p>
            {unit.includedHeaderFileIds.length > 0 ? (
              <p className="mt-1 text-slate-600">
                Includes project headers through #include (conceptual preprocessing).
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
