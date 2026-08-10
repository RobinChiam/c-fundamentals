import { DiffEditor } from "@monaco-editor/react";
import { useEffect } from "react";
import { setupMonaco } from "../../monaco/setup-monaco";

interface MonacoDiffViewerProps {
  original: string;
  modified: string;
}

export function MonacoDiffViewer({
  original,
  modified,
}: MonacoDiffViewerProps) {
  useEffect(() => {
    setupMonaco();
  }, []);

  return (
    <DiffEditor
      height="28rem"
      language="cpp"
      theme="vs-dark"
      original={original}
      modified={modified}
      options={{
        readOnly: true,
        renderSideBySide: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
      }}
    />
  );
}
