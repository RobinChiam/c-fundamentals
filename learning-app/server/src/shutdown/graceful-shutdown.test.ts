import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanupOwnedDockerContainers,
  OWNED_CONTAINER_PREFIXES,
} from "./graceful-shutdown.js";

const spawnMock = vi.fn();

vi.mock("node:child_process", () => ({
  spawn: (...args: unknown[]) => spawnMock(...args),
}));

describe("cleanupOwnedDockerContainers", () => {
  afterEach(() => {
    spawnMock.mockReset();
  });

  it("removes containers for every owned prefix", async () => {
    const psResponses = new Map<string, string>([
      [`name=${OWNED_CONTAINER_PREFIXES[0]}`, "compile-1\ncompile-2\n"],
      [`name=${OWNED_CONTAINER_PREFIXES[1]}`, "run-1\n"],
      [`name=${OWNED_CONTAINER_PREFIXES[2]}`, "lab-1\ncompile-2\n"],
    ]);

    spawnMock.mockImplementation((command: string, args: string[]) => {
      if (args[0] === "ps") {
        const filter = args[3] ?? "";
        const stdout = psResponses.get(filter) ?? "";
        return {
          stdout: {
            on(event: string, handler: (chunk: Buffer) => void) {
              if (event === "data") {
                handler(Buffer.from(stdout, "utf8"));
              }
            },
          },
          on(event: string, handler: () => void) {
            if (event === "close") {
              handler();
            }
          },
        };
      }

      if (args[0] === "rm") {
        return {
          on(event: string, handler: () => void) {
            if (event === "close" || event === "error") {
              handler();
            }
          },
        };
      }

      throw new Error(`Unexpected spawn: ${command} ${args.join(" ")}`);
    });

    await cleanupOwnedDockerContainers("docker");

    const removedIds = spawnMock.mock.calls
      .filter((call) => call[1]?.[0] === "rm")
      .map((call) => call[1]?.[2]);

    expect(removedIds.sort()).toEqual(["compile-1", "compile-2", "lab-1", "run-1"]);
  });
});
