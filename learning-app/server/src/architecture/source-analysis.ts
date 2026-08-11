/**
 * Conservative source analysis for curriculum architecture views.
 * Not a full C preprocessor or parser.
 */

const PROJECT_INCLUDE_PATTERN = /^\s*#\s*include\s+"([^"]+)"/gm;
const SYSTEM_INCLUDE_PATTERN = /^\s*#\s*include\s+<([^>]+)>/gm;

export interface ParsedIncludes {
  projectIncludes: string[];
  systemIncludes: string[];
}

export function extractIncludes(source: string): ParsedIncludes {
  const projectIncludes: string[] = [];
  const systemIncludes: string[] = [];

  for (const match of source.matchAll(PROJECT_INCLUDE_PATTERN)) {
    const includeName = match[1];
    if (includeName !== undefined) {
      projectIncludes.push(includeName);
    }
  }

  for (const match of source.matchAll(SYSTEM_INCLUDE_PATTERN)) {
    const includeName = match[1];
    if (includeName !== undefined) {
      systemIncludes.push(includeName);
    }
  }

  return { projectIncludes, systemIncludes };
}

export function detectIncludeGuard(source: string): string | null {
  const ifndefMatch = source.match(/^\s*#\s*ifndef\s+([A-Z_][A-Z0-9_]*)/m);
  if (!ifndefMatch?.[1]) {
    return null;
  }

  const macro = ifndefMatch[1];
  const definePattern = new RegExp(`^\\s*#\\s*define\\s+${macro}\\b`, "m");
  if (!definePattern.test(source)) {
    return null;
  }

  return macro;
}

export interface ManifestFileLookup {
  id: string;
  name: string;
}

/**
 * Resolve a quoted project include to a manifest file by exact file name.
 * Returns null when no manifest-approved file matches.
 */
export function resolveProjectInclude(
  includeName: string,
  manifestFiles: ManifestFileLookup[],
): ManifestFileLookup | null {
  const normalized = includeName.trim();
  if (
    normalized.length === 0 ||
    normalized.includes("/") ||
    normalized.includes("\\") ||
    normalized.includes("..")
  ) {
    return null;
  }

  const matches = manifestFiles.filter((file) => file.name === normalized);
  if (matches.length !== 1) {
    return null;
  }

  return matches[0] ?? null;
}

export function symbolAppearsInSource(
  source: string,
  symbol: string,
): boolean {
  if (symbol.length === 0) {
    return false;
  }
  const pattern = new RegExp(`\\b${escapeRegExp(symbol)}\\b`);
  return pattern.test(source);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
