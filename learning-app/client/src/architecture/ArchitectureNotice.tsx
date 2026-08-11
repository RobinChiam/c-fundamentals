export function ArchitectureNotice() {
  return (
    <div
      role="note"
      className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <p className="font-medium">Architecture Explorer</p>
      <p className="mt-1">
        This view explains the structure of the curriculum project. It does not
        dynamically analyze your edited C source.
      </p>
    </div>
  );
}
