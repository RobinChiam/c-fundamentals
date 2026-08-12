import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import { useEffect, useRef } from "react";
import type { ExecutionResult } from "@learning-app/shared";
import "@xterm/xterm/css/xterm.css";

interface RuntimeTerminalProps {
  execution: ExecutionResult | null;
}

function formatExecutionLines(execution: ExecutionResult): string[] {
  const lines: string[] = [];

  if (execution.stdout) {
    lines.push(execution.stdout.replace(/\n$/, ""));
  }

  if (execution.stderr) {
    if (lines.length > 0) {
      lines.push("");
    }
    lines.push("[stderr]");
    lines.push(execution.stderr.replace(/\n$/, ""));
  }

  lines.push("");
  lines.push(`Outcome: ${execution.outcome}`);
  if (execution.exitCode !== null) {
    lines.push(`Exit code: ${execution.exitCode}`);
  }
  lines.push(`Duration: ${execution.durationMs} ms`);

  if (execution.stdoutTruncated) {
    lines.push("stdout truncated");
  }
  if (execution.stderrTruncated) {
    lines.push("stderr truncated");
  }

  return lines;
}

export function RuntimeTerminal({ execution }: RuntimeTerminalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!containerRef.current || terminalRef.current) {
      return;
    }

    const terminal = new Terminal({
      disableStdin: true,
      cursorBlink: false,
      convertEol: true,
      theme: {
        background: "#020617",
        foreground: "#e2e8f0",
      },
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: 13,
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(containerRef.current);
    fitAddon.fit();

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    return () => {
      terminal.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  useEffect(() => {
    const terminal = terminalRef.current;
    const fitAddon = fitAddonRef.current;
    if (!terminal) {
      return;
    }

    terminal.reset();
    if (!execution) {
      terminal.writeln("Run a program to see terminal output here.");
      fitAddon?.fit();
      return;
    }

    for (const line of formatExecutionLines(execution)) {
      terminal.writeln(line);
    }
    fitAddon?.fit();
  }, [execution]);

  return (
    <div className="mt-4">
      <h4 className="mb-2 text-sm font-medium text-slate-700">Program output</h4>
      {execution ? (
        <pre
          className="sr-only"
          aria-live="polite"
          data-testid="runtime-output-text"
        >
          {formatExecutionLines(execution).join("\n")}
        </pre>
      ) : (
        <p className="sr-only">Run a program to see terminal output here.</p>
      )}
      <div
        ref={containerRef}
        aria-hidden="true"
        className="h-56 overflow-hidden rounded-md border border-slate-800 bg-slate-950 p-1"
      />
    </div>
  );
}
