import {
  COMPILE_CPUS,
  COMPILE_MEMORY,
  COMPILE_MEMORY_SWAP,
  COMPILE_PIDS,
  CONTAINER_PROGRAM_PATH,
  CONTAINER_SANDBOX_PATH,
  CONTAINER_WORKSPACE_PATH,
  RUN_CPUS,
  RUN_MEMORY,
  RUN_MEMORY_SWAP,
  RUN_PIDS,
  RUNNER_IMAGE,
  RUNNER_RUNTIME_USER,
} from "./runner-config.js";

export interface CompileDockerRunOptions {
  containerName: string;
  hostWorkspacePath: string;
  image?: string;
  gccArgs: string[];
}

export interface ExecuteDockerRunOptions {
  containerName: string;
  hostWorkspacePath: string;
  image?: string;
}

function sharedSecurityArgs(): string[] {
  return [
    "--network",
    "none",
    "--cap-drop",
    "ALL",
    "--security-opt",
    "no-new-privileges",
    "--pull",
    "never",
  ];
}

export function buildCompileDockerArgs(
  options: CompileDockerRunOptions,
): string[] {
  const image = options.image ?? RUNNER_IMAGE;

  return [
    "run",
    "--name",
    options.containerName,
    "--rm",
    ...sharedSecurityArgs(),
    "--read-only",
    "--pids-limit",
    COMPILE_PIDS,
    "--memory",
    COMPILE_MEMORY,
    "--memory-swap",
    COMPILE_MEMORY_SWAP,
    "--cpus",
    COMPILE_CPUS,
    "-v",
    `${options.hostWorkspacePath}:${CONTAINER_WORKSPACE_PATH}:rw`,
    "--tmpfs",
    "/tmp",
    "-w",
    CONTAINER_WORKSPACE_PATH,
    image,
    "gcc",
    ...options.gccArgs,
  ];
}

export function buildExecuteDockerArgs(
  options: ExecuteDockerRunOptions,
): string[] {
  const image = options.image ?? RUNNER_IMAGE;

  return [
    "run",
    "--name",
    options.containerName,
    "--rm",
    ...sharedSecurityArgs(),
    "--read-only",
    "--pids-limit",
    RUN_PIDS,
    "--memory",
    RUN_MEMORY,
    "--memory-swap",
    RUN_MEMORY_SWAP,
    "--cpus",
    RUN_CPUS,
    "--user",
    RUNNER_RUNTIME_USER,
    "-i",
    "-v",
    `${options.hostWorkspacePath}:${CONTAINER_WORKSPACE_PATH}:ro`,
    "--tmpfs",
    `${CONTAINER_SANDBOX_PATH}:exec,mode=1777`,
    "--tmpfs",
    "/tmp:exec,mode=1777",
    "-w",
    CONTAINER_SANDBOX_PATH,
    "--entrypoint",
    CONTAINER_PROGRAM_PATH,
    image,
  ];
}

export function buildDockerVersionArgs(): string[] {
  return ["version", "--format", "{{.Server.Version}}"];
}

export function buildDockerImageInspectArgs(image = RUNNER_IMAGE): string[] {
  return ["image", "inspect", "--format", "{{.Id}}", image];
}
