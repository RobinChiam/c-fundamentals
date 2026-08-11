import { useEffect, useState } from "react";
import { getLessonFile } from "../api/curriculum-api";

interface ArchitectureSourceViewerProps {
  lessonId: string;
  fileId: string | null;
  fileName: string | null;
}

export function ArchitectureSourceViewer({
  lessonId,
  fileId,
  fileName,
}: ArchitectureSourceViewerProps) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fileId) {
      setContent(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void getLessonFile(lessonId, fileId)
      .then((response) => {
        if (!cancelled) {
          setContent(response.content);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setContent(null);
          setError("Unable to load source for the selected file.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [lessonId, fileId]);

  if (!fileId || !fileName) {
    return (
      <section className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Select a source or header file to inspect read-only curriculum source.
      </section>
    );
  }

  return (
    <section
      aria-labelledby="architecture-source-heading"
      className="rounded-md border border-slate-200 bg-white"
    >
      <header className="border-b border-slate-200 px-4 py-2">
        <h3 id="architecture-source-heading" className="text-sm font-semibold text-slate-900">
          {fileName} (read-only)
        </h3>
      </header>
      <div className="max-h-96 overflow-auto p-4">
        {loading ? (
          <p className="text-sm text-slate-600">Loading source…</p>
        ) : error ? (
          <p className="text-sm text-red-700">{error}</p>
        ) : (
          <pre className="whitespace-pre-wrap font-mono text-xs text-slate-800">
            {content}
          </pre>
        )}
      </div>
    </section>
  );
}
