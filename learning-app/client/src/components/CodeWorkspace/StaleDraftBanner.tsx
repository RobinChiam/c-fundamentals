interface StaleDraftBannerProps {
  fileName: string;
  onUse: () => void;
  onDiscard: () => void;
}

export function StaleDraftBanner({
  fileName,
  onUse,
  onDiscard,
}: StaleDraftBannerProps) {
  return (
    <div
      role="alert"
      className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4"
    >
      <h3 className="text-sm font-semibold text-amber-900">
        Saved draft needs review
      </h3>
      <p className="mt-1 text-sm text-amber-800">
        This lesson changed since your draft for {fileName} was saved.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onUse}
          className="rounded-md border border-amber-400 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100"
        >
          Use Saved Draft
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="rounded-md border border-amber-300 bg-transparent px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100"
        >
          Discard Saved Draft
        </button>
      </div>
    </div>
  );
}
