import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const clientDir = path.dirname(fileURLToPath(import.meta.url));
const monacoDir = path.resolve(clientDir, "node_modules/monaco-editor");

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "monaco-editor": monacoDir,
    },
  },
  optimizeDeps: {
    exclude: ["monaco-editor"],
  },
  worker: {
    format: "es",
    plugins: () => [react()],
    rollupOptions: {
      output: {
        format: "es",
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test-setup.tsx",
  },
});
