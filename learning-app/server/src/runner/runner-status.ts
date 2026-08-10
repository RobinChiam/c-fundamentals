import type { RunnerStatus, RunnerUnavailableReason } from "@learning-app/shared";
import {
  buildDockerImageInspectArgs,
  buildDockerVersionArgs,
} from "./docker-runtime.js";
import type { DockerProcessRunner } from "./docker-process.js";
import { createDockerProcessRunner } from "./docker-process.js";
import {
  DOCKER_COMMAND,
  RUNNER_IMAGE,
  STATUS_PROBE_TIMEOUT_MS,
} from "./runner-config.js";

export interface RunnerStatusProbeOptions {
  dockerRunner?: DockerProcessRunner;
  dockerCommand?: string;
  runnerImage?: string;
}

async function probeDockerCli(
  runner: DockerProcessRunner,
): Promise<RunnerUnavailableReason | null> {
  const result = await runner.run({
    args: ["--version"],
    timeoutMs: STATUS_PROBE_TIMEOUT_MS,
    maxStdoutBytes: 4096,
    maxStderrBytes: 4096,
  });

  if (result.spawnError || result.timedOut || result.exitCode !== 0) {
    return "runtime_missing";
  }

  return null;
}

async function probeDockerDaemon(
  runner: DockerProcessRunner,
): Promise<RunnerUnavailableReason | null> {
  const result = await runner.run({
    args: buildDockerVersionArgs(),
    timeoutMs: STATUS_PROBE_TIMEOUT_MS,
    maxStdoutBytes: 4096,
    maxStderrBytes: 4096,
  });

  if (result.spawnError || result.timedOut || result.exitCode !== 0) {
    return "daemon_unavailable";
  }

  return null;
}

async function probeRunnerImage(
  runner: DockerProcessRunner,
  image: string,
): Promise<RunnerUnavailableReason | null> {
  const result = await runner.run({
    args: buildDockerImageInspectArgs(image),
    timeoutMs: STATUS_PROBE_TIMEOUT_MS,
    maxStdoutBytes: 4096,
    maxStderrBytes: 4096,
  });

  if (result.spawnError || result.timedOut || result.exitCode !== 0) {
    return "image_missing";
  }

  return null;
}

export async function probeRunnerStatus(
  options: RunnerStatusProbeOptions = {},
): Promise<RunnerStatus> {
  const image = options.runnerImage ?? RUNNER_IMAGE;
  const runner =
    options.dockerRunner ??
    createDockerProcessRunner(options.dockerCommand ?? DOCKER_COMMAND);

  const baseStatus: RunnerStatus = {
    available: false,
    runtime: "docker",
    image,
    reason: "unsupported",
  };

  const cliReason = await probeDockerCli(runner);
  if (cliReason) {
    return { ...baseStatus, reason: cliReason };
  }

  const daemonReason = await probeDockerDaemon(runner);
  if (daemonReason) {
    return { ...baseStatus, reason: daemonReason };
  }

  const imageReason = await probeRunnerImage(runner, image);
  if (imageReason) {
    return { ...baseStatus, reason: imageReason };
  }

  return {
    available: true,
    runtime: "docker",
    image,
    reason: null,
  };
}
