import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.mock("@monaco-editor/react", () => {
  const Editor = ({
    value,
    onChange,
    options,
  }: {
    value: string;
    onChange?: (value: string) => void;
    options?: { readOnly?: boolean };
  }) => (
    <textarea
      aria-label="monaco-editor"
      readOnly={options?.readOnly}
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
    />
  );

  const DiffEditor = ({
    original,
    modified,
  }: {
    original: string;
    modified: string;
  }) => (
    <div data-testid="monaco-diff">
      <div data-testid="diff-original">{original}</div>
      <div data-testid="diff-modified">{modified}</div>
    </div>
  );

  return {
    default: Editor,
    DiffEditor,
    loader: {
      config: vi.fn(),
      init: vi.fn().mockResolvedValue(undefined),
    },
  };
});

vi.mock("./monaco/setup-monaco", () => ({
  setupMonaco: vi.fn(),
}));

vi.mock("@xterm/xterm", () => ({
  Terminal: class {
    loadAddon() {}
    open() {}
    reset() {}
    writeln() {}
    dispose() {}
  },
}));

vi.mock("@xterm/addon-fit", () => ({
  FitAddon: class {
    fit() {}
  },
}));
