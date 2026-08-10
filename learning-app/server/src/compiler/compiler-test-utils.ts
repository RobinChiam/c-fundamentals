import type { ProcessRunner } from "./compiler-process.js";

export function createStubProcessRunner(
  implementation: ProcessRunner["run"],
): ProcessRunner {
  return { run: implementation };
}
