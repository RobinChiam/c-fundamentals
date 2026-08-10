export const RUNNER_IMAGE = "gcc:15.3.0-trixie";
export const DOCKER_COMMAND = "docker";

export const EXECUTION_TIMEOUT_MS = 5_000;
export const MAX_STDIN_BYTES = 64 * 1024;
export const MAX_STDOUT_BYTES = 256 * 1024;
export const MAX_STDERR_BYTES = 256 * 1024;

export const RUN_MEMORY = "128m";
export const RUN_MEMORY_SWAP = "128m";
export const RUN_CPUS = "0.5";
export const RUN_PIDS = "32";

export const COMPILE_MEMORY = "512m";
export const COMPILE_MEMORY_SWAP = "512m";
export const COMPILE_CPUS = "1";
export const COMPILE_PIDS = "64";

export const CONTAINER_WORKSPACE_PATH = "/workspace";
export const CONTAINER_SANDBOX_PATH = "/sandbox";
export const CONTAINER_PROGRAM_PATH = "/workspace/program";
export const SANDBOX_EXECUTABLE_NAME = "program";

export const TEMP_RUN_WORKSPACE_PREFIX = "c-fundamentals-run-";
export const COMPILE_CONTAINER_PREFIX = "cfund-compile-";
export const RUN_CONTAINER_PREFIX = "cfund-run-";

export const RUN_BODY_LIMIT_BYTES =
  512 * 1024 + MAX_STDIN_BYTES + 64 * 1024;

export const STATUS_PROBE_TIMEOUT_MS = 3_000;
export const COMPILE_STAGE_TIMEOUT_MS = 10_000;

export const RUNNER_RUNTIME_USER = "65534:65534";
