import { describe, expect, it } from "vitest";
import { probeRunnerStatus } from "./runner-status.js";
import { RUNNER_IMAGE } from "./runner-config.js";
import { statusProbeRunner } from "./runner-test-utils.js";

describe("runner status", () => {
  it("reports runtime_missing when Docker CLI is unavailable", async () => {
    const status = await probeRunnerStatus({
      dockerRunner: statusProbeRunner({ cliAvailable: false }),
    });

    expect(status).toEqual({
      available: false,
      runtime: "docker",
      image: RUNNER_IMAGE,
      reason: "runtime_missing",
    });
  });

  it("reports daemon_unavailable when Docker daemon cannot be contacted", async () => {
    const status = await probeRunnerStatus({
      dockerRunner: statusProbeRunner({ daemonAvailable: false }),
    });

    expect(status.reason).toBe("daemon_unavailable");
    expect(status.available).toBe(false);
  });

  it("reports image_missing when runner image is absent", async () => {
    const status = await probeRunnerStatus({
      dockerRunner: statusProbeRunner({ imageAvailable: false }),
    });

    expect(status.reason).toBe("image_missing");
    expect(status.available).toBe(false);
  });

  it("reports ready when Docker and image are available", async () => {
    const status = await probeRunnerStatus({
      dockerRunner: statusProbeRunner({}),
    });

    expect(status).toEqual({
      available: true,
      runtime: "docker",
      image: RUNNER_IMAGE,
      reason: null,
    });
  });

  it("does not expose raw Docker errors in status payload", async () => {
    const status = await probeRunnerStatus({
      dockerRunner: statusProbeRunner({ daemonAvailable: false }),
    });

    expect(JSON.stringify(status)).not.toMatch(/\/tmp\//);
    expect(JSON.stringify(status)).not.toMatch(/Cannot connect/);
  });
});
