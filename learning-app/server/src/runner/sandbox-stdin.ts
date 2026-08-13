import { MAX_STDIN_BYTES } from "./runner-config.js";

function byteLength(content: string): number {
  return Buffer.byteLength(content, "utf8");
}

/**
 * Lesson programs use fgets() and treat a final line without a newline as
 * "input too long". Program Input is often a single value like "5" with no
 * Enter, so append a newline when it is missing and there is room.
 */
export function normalizeSandboxStdin(stdin: string): string {
  if (stdin.length === 0 || stdin.endsWith("\n")) {
    return stdin;
  }
  if (byteLength(stdin) >= MAX_STDIN_BYTES) {
    return stdin;
  }
  return `${stdin}\n`;
}
