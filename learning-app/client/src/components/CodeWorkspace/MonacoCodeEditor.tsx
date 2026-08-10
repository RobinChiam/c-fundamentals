import Editor from "@monaco-editor/react";
import { useEffect } from "react";
import { setupMonaco } from "../../monaco/setup-monaco";

interface MonacoCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function MonacoCodeEditor({
  value,
  onChange,
  readOnly = false,
}: MonacoCodeEditorProps) {
  useEffect(() => {
    setupMonaco();
  }, []);

  return (
    <Editor
      height="28rem"
      language="cpp"
      theme="vs-dark"
      value={value}
      onChange={(nextValue) => onChange(nextValue ?? "")}
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true,
        bracketPairColorization: { enabled: true },
        tabSize: 4,
        insertSpaces: true,
      }}
    />
  );
}
