import path from "node:path";
import type { CompilerDiagnostic, DiagnosticSeverity } from "@learning-app/shared";

const GCC_DIAGNOSTIC_PATTERN =
  /^(?<fileName>[^:]+):(?<line>\d+):(?<column>\d+):\s*(?<severity>error|warning|note):\s*(?<message>.+)$/;

const WARNING_OPTION_PATTERN = /\s*\[-W(?<option>[^\]]+)\]\s*$/;

export interface DiagnosticParseContext {
  fileNameToId: Map<string, string>;
}

function parseSeverity(value: string): DiagnosticSeverity {
  if (value === "error" || value === "warning" || value === "note") {
    return value;
  }
  return "note";
}

function parseDiagnosticLine(
  line: string,
  context: DiagnosticParseContext,
): CompilerDiagnostic | null {
  const match = GCC_DIAGNOSTIC_PATTERN.exec(line.trim());
  if (!match?.groups) {
    return null;
  }

  let message = match.groups.message.trim();
  let option: string | undefined;

  const optionMatch = WARNING_OPTION_PATTERN.exec(message);
  if (optionMatch?.groups?.option) {
    option = optionMatch.groups.option;
    message = message.slice(0, optionMatch.index).trim();
  }

  const fileName = match.groups.fileName.trim();
  const fileId = context.fileNameToId.get(fileName);

  return {
    severity: parseSeverity(match.groups.severity),
    fileName,
    ...(fileId ? { fileId } : {}),
    line: Number.parseInt(match.groups.line, 10),
    column: Number.parseInt(match.groups.column, 10),
    message,
    ...(option ? { option } : {}),
  };
}

export function parseGccDiagnostics(
  stderr: string,
  context: DiagnosticParseContext,
): CompilerDiagnostic[] {
  const diagnostics: CompilerDiagnostic[] = [];

  for (const line of stderr.split(/\r?\n/u)) {
    if (!line.trim()) {
      continue;
    }

    const diagnostic = parseDiagnosticLine(line, context);
    if (diagnostic) {
      diagnostics.push(diagnostic);
    }
  }

  return diagnostics;
}

export function sanitizeCompilerOutput(
  output: string,
  tempWorkspacePath: string,
): string {
  if (!output || !tempWorkspacePath) {
    return output;
  }

  const prefixes = [
    `${tempWorkspacePath.replaceAll("\\", "/")}/`,
    `${tempWorkspacePath}${path.sep}`,
    tempWorkspacePath.replaceAll("\\", "/"),
    tempWorkspacePath,
  ];

  let sanitized = output;
  for (const prefix of prefixes) {
    sanitized = sanitized.split(prefix).join("");
  }

  return sanitized;
}
