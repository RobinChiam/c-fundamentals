import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { DockerProcessRunner, DockerRunOptions, DockerRunResult } from "./docker-process.js";
import { SANDBOX_EXECUTABLE_NAME } from "./runner-config.js";

export function createStubDockerRunner(
  implementation: DockerProcessRunner["run"],
  overrides: Partial<Pick<DockerProcessRunner, "killContainer" | "removeContainer">> = {},
): DockerProcessRunner {
  return {
    run: implementation,
    killContainer: overrides.killContainer ?? (async () => {}),
    removeContainer: overrides.removeContainer ?? (async () => {}),
  };
}

export function recordDockerCalls(
  handler: (options: DockerRunOptions, callIndex: number) => DockerRunResult | Promise<DockerRunResult>,
): {
  runner: DockerProcessRunner;
  calls: DockerRunOptions[];
  killCalls: string[];
  removeCalls: string[];
} {
  const calls: DockerRunOptions[] = [];
  const killCalls: string[] = [];
  const removeCalls: string[] = [];
  let callIndex = 0;

  const runner = createStubDockerRunner(
    async (options) => {
      calls.push(structuredClone(options));
      const result = await handler(options, callIndex);
      callIndex += 1;
      return result;
    },
    {
      killContainer: async (name) => {
        killCalls.push(name);
      },
      removeContainer: async (name) => {
        removeCalls.push(name);
      },
    },
  );

  return { runner, calls, killCalls, removeCalls };
}

export function successfulDockerResult(
  overrides: Partial<DockerRunResult> = {},
): DockerRunResult {
  return {
    exitCode: 0,
    stdout: "",
    stderr: "",
    stdoutTruncated: false,
    stderrTruncated: false,
    timedOut: false,
    spawnError: false,
    outputLimitExceeded: false,
    shellUsed: false,
    ...overrides,
  };
}

export function isRunnerStatusProbe(args: string[]): boolean {
  const command = args[0];
  return command === "--version" || command === "version" || command === "image";
}

export function isRunnerCleanupCommand(args: string[]): boolean {
  const command = args[0];
  return command === "kill" || command === "rm";
}

export function isSandboxCompileRun(args: string[]): boolean {
  return args[0] === "run" && args.includes("gcc");
}

export function isSandboxExecuteRun(args: string[]): boolean {
  return args[0] === "run" && args.includes("--entrypoint");
}

export function createReadyDockerRunner(
  handler: (
    options: DockerRunOptions,
    phase: "compile" | "execute",
  ) => DockerRunResult | Promise<DockerRunResult>,
) {
  return recordDockerCalls(async (options) => {
    if (isRunnerStatusProbe(options.args) || isRunnerCleanupCommand(options.args)) {
      if (options.args[0] === "--version") {
        return successfulDockerResult({ stdout: "Docker version 27.0.0" });
      }
      if (options.args[0] === "version") {
        return successfulDockerResult({ stdout: "27.0.0" });
      }
      if (options.args[0] === "image") {
        return successfulDockerResult({ stdout: "sha256:abc" });
      }
      return successfulDockerResult();
    }

    if (isSandboxCompileRun(options.args)) {
      const result = await handler(options, "compile");
      if (result.exitCode === 0 && !result.spawnError && !result.timedOut) {
        const mount = options.args.find((arg) => arg.includes(":/workspace:"));
        const hostPath = mount?.split(":")[0];
        if (hostPath) {
          await writeFile(
            path.join(hostPath, SANDBOX_EXECUTABLE_NAME),
            "",
            "utf8",
          );
        }
      }
      return result;
    }

    if (isSandboxExecuteRun(options.args)) {
      return handler(options, "execute");
    }

    return successfulDockerResult();
  });
}

export function statusProbeRunner(options: {
  cliAvailable?: boolean;
  daemonAvailable?: boolean;
  imageAvailable?: boolean;
}): DockerProcessRunner {
  return createStubDockerRunner(async (runOptions) => {
    const command = runOptions.args[0];

    if (command === "--version") {
      return successfulDockerResult({
        exitCode: options.cliAvailable === false ? 1 : 0,
        stdout: options.cliAvailable === false ? "" : "Docker version 27.0.0",
        spawnError: options.cliAvailable === false,
      });
    }

    if (command === "version") {
      return successfulDockerResult({
        exitCode: options.daemonAvailable === false ? 1 : 0,
        stdout: options.daemonAvailable === false ? "" : "27.0.0",
        spawnError: options.daemonAvailable === false,
      });
    }

    if (command === "image") {
      return successfulDockerResult({
        exitCode: options.imageAvailable === false ? 1 : 0,
        stdout: options.imageAvailable === false ? "" : "sha256:abc",
        spawnError: options.imageAvailable === false,
      });
    }

    return successfulDockerResult();
  });
}
