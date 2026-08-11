import type { BuildMistake } from "@learning-app/shared";

interface BuildMistakesProps {
  mistakes: BuildMistake[];
}

const CATEGORY_LABELS: Record<BuildMistake["category"], string> = {
  compile: "Compile error",
  link: "Link error",
  preprocessor: "Preprocessor issue",
};

export function BuildMistakes({ mistakes }: BuildMistakesProps) {
  return (
    <ul className="space-y-4">
      {mistakes.map((mistake) => (
        <li
          key={mistake.id}
          className="rounded-md border border-slate-200 bg-white p-4"
        >
          <h3 className="text-base font-semibold text-slate-900">{mistake.title}</h3>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            {CATEGORY_LABELS[mistake.category]}
          </p>
          <p className="mt-2 text-sm text-slate-700">{mistake.description}</p>
        </li>
      ))}
    </ul>
  );
}
