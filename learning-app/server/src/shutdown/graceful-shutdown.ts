import {
  COMPILE_CONTAINER_PREFIX,
  LAB_CONTAINER_PREFIX,
  RUN_CONTAINER_PREFIX,
} from "../runner/runner-config.js";

export interface ShutdownHooks {
  onShutdownRequested?: () => void;
  cleanupOwnedDockerContainers?: () => Promise<void>;
  terminateOwnedCompilerProcesses?: () => Promise<void>;
}

export interface ShutdownManager {
  isShuttingDown(): boolean;
  requestShutdown(): void;
  registerShutdownHandler(handler: () => Promise<void>): void;
  runShutdown(): Promise<void>;
}

const SHUTDOWN_DEADLINE_MS = 10_000;

export function createShutdownManager(
  hooks: ShutdownHooks = {},
): ShutdownManager {
  let shuttingDown = false;
  const handlers: Array<() => Promise<void>> = [];

  return {
    isShuttingDown() {
      return shuttingDown;
    },

    requestShutdown() {
      if (shuttingDown) {
        return;
      }
      shuttingDown = true;
      hooks.onShutdownRequested?.();
    },

    registerShutdownHandler(handler: () => Promise<void>) {
      handlers.push(handler);
    },

    async runShutdown() {
      this.requestShutdown();

      const deadline = new Promise<void>((resolve) => {
        setTimeout(resolve, SHUTDOWN_DEADLINE_MS);
      });

      const cleanup = (async () => {
        if (hooks.terminateOwnedCompilerProcesses) {
          await hooks.terminateOwnedCompilerProcesses();
        }
        if (hooks.cleanupOwnedDockerContainers) {
          await hooks.cleanupOwnedDockerContainers();
        }
        for (const handler of handlers) {
          await handler();
        }
      })();

      await Promise.race([cleanup, deadline]);
    },
  };
}

export const OWNED_CONTAINER_PREFIXES = [
  COMPILE_CONTAINER_PREFIX,
  RUN_CONTAINER_PREFIX,
  LAB_CONTAINER_PREFIX,
] as const;

function listOwnedContainerIds(
  spawn: typeof import("node:child_process").spawn,
  dockerCommand: string,
  prefix: string,
): Promise<string[]> {
  return new Promise((resolve) => {
    const child = spawn(
      dockerCommand,
      ["ps", "-aq", "--filter", `name=${prefix}`],
      { shell: false },
    );

    let stdout = "";
    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });

    child.on("close", () => {
      resolve(
        stdout
          .split(/\r?\n/u)
          .map((line) => line.trim())
          .filter((line) => line.length > 0),
      );
    });

    child.on("error", () => resolve([]));
  });
}

function removeContainer(
  spawn: typeof import("node:child_process").spawn,
  dockerCommand: string,
  id: string,
): Promise<void> {
  return new Promise((resolve) => {
    const remove = spawn(dockerCommand, ["rm", "-f", id], { shell: false });
    remove.on("close", () => resolve());
    remove.on("error", () => resolve());
  });
}

export async function cleanupOwnedDockerContainers(
  dockerCommand = "docker",
): Promise<void> {
  const { spawn } = await import("node:child_process");
  const ownedIds = new Set<string>();

  for (const prefix of OWNED_CONTAINER_PREFIXES) {
    const ids = await listOwnedContainerIds(spawn, dockerCommand, prefix);
    for (const id of ids) {
      ownedIds.add(id);
    }
  }

  await Promise.all(
    [...ownedIds].map((id) => removeContainer(spawn, dockerCommand, id)),
  );
}

export function registerProcessSignalHandlers(
  shutdownManager: ShutdownManager,
  onComplete: () => Promise<void>,
  options: { registerSignals?: boolean } = {},
): void {
  if (options.registerSignals === false) {
    return;
  }

  let handling = false;

  const handle = (): void => {
    if (handling) {
      return;
    }
    handling = true;

    void (async () => {
      await shutdownManager.runShutdown();
      await onComplete();
      process.exit(0);
    })();
  };

  process.once("SIGINT", handle);
  process.once("SIGTERM", handle);
}
