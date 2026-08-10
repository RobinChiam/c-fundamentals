import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import editorWorkerUrl from "monaco-editor/esm/vs/editor/editor.worker.js?url";

let configured = false;

export function setupMonaco(): void {
  if (configured || typeof window === "undefined") {
    return;
  }

  self.MonacoEnvironment = {
    getWorker() {
      return new Worker(editorWorkerUrl, { type: "module" });
    },
  };

  loader.config({ monaco });
  void loader.init();
  configured = true;
}
