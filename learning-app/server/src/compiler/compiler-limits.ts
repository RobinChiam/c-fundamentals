export const MAX_WORKSPACE_FILES = 16;
export const MAX_FILE_BYTES = 128 * 1024;
export const MAX_TOTAL_SOURCE_BYTES = 512 * 1024;
export const COMPILE_TIMEOUT_MS = 10_000;
export const MAX_STDOUT_BYTES = 256 * 1024;
export const MAX_STDERR_BYTES = 256 * 1024;
export const COMPILE_BODY_LIMIT_BYTES = MAX_TOTAL_SOURCE_BYTES + 64 * 1024;
export const TEMP_WORKSPACE_PREFIX = "c-fundamentals-compile-";
export const GCC_COMMAND = "gcc";

export const BASE_GCC_FLAGS = [
  "-std=c17",
  "-Wall",
  "-Wextra",
  "-Wpedantic",
  "-fdiagnostics-color=never",
] as const;

export const KNOWN_LINK_FLAGS = new Set(["-lm"]);
