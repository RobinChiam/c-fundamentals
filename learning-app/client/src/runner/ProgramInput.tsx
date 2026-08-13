interface ProgramInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ProgramInput({ value, onChange, disabled = false }: ProgramInputProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        Program input
      </span>
      <textarea
        aria-label="Program input"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        placeholder="Type input as you would in a terminal, then Run"
      />
      <span className="mt-1 block text-xs text-slate-500">
        A newline is added automatically if the last line has no Enter.
      </span>
    </label>
  );
}
