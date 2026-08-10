import { describe, expect, it } from "vitest";
import {
  buildCompileDockerArgs,
  buildExecuteDockerArgs,
} from "./docker-runtime.js";
import { RUNNER_IMAGE } from "./runner-config.js";

describe("docker runtime args", () => {
  it("uses the pinned image for compile and execution", () => {
    const compileArgs = buildCompileDockerArgs({
      containerName: "cfund-compile-test",
      hostWorkspacePath: "/tmp/workspace",
      gccArgs: ["-o", "program", "main.c"],
    });
    const executeArgs = buildExecuteDockerArgs({
      containerName: "cfund-run-test",
      hostWorkspacePath: "/tmp/workspace",
    });

    expect(compileArgs).toContain(RUNNER_IMAGE);
    expect(executeArgs).toContain(RUNNER_IMAGE);
  });

  it("includes required security flags", () => {
    const compileArgs = buildCompileDockerArgs({
      containerName: "cfund-compile-test",
      hostWorkspacePath: "/tmp/workspace",
      gccArgs: ["main.c"],
    });
    const executeArgs = buildExecuteDockerArgs({
      containerName: "cfund-run-test",
      hostWorkspacePath: "/tmp/workspace",
    });

    for (const args of [compileArgs, executeArgs]) {
      expect(args).toContain("--pull");
      expect(args).toContain("never");
      expect(args).toContain("--network");
      expect(args).toContain("none");
      expect(args).toContain("--read-only");
      expect(args).toContain("--cap-drop");
      expect(args).toContain("ALL");
      expect(args).toContain("--security-opt");
      expect(args).toContain("no-new-privileges");
      expect(args).not.toContain("--privileged");
      expect(args).not.toContain("seccomp=unconfined");
      expect(args).not.toContain("/var/run/docker.sock");
    }
  });

  it("mounts only the generated temp workspace", () => {
    const hostPath = "/tmp/c-fundamentals-run-abc";
    const compileArgs = buildCompileDockerArgs({
      containerName: "cfund-compile-test",
      hostWorkspacePath: hostPath,
      gccArgs: ["main.c"],
    });
    const executeArgs = buildExecuteDockerArgs({
      containerName: "cfund-run-test",
      hostWorkspacePath: hostPath,
    });

    expect(compileArgs).toContain(`${hostPath}:/workspace:rw`);
    expect(executeArgs).toContain(`${hostPath}:/workspace:ro`);
    expect(compileArgs.filter((arg) => arg.includes(":/workspace:"))).toEqual([
      `${hostPath}:/workspace:rw`,
    ]);
    expect(executeArgs.filter((arg) => arg.includes(":/workspace:"))).toEqual([
      `${hostPath}:/workspace:ro`,
    ]);
  });

  it("uses execution sandbox tmpfs and non-root user", () => {
    const executeArgs = buildExecuteDockerArgs({
      containerName: "cfund-run-test",
      hostWorkspacePath: "/tmp/workspace",
    });

    expect(executeArgs).toContain("--user");
    expect(executeArgs).toContain("65534:65534");
    expect(executeArgs).toContain("--tmpfs");
    expect(executeArgs).toContain("/sandbox:exec,mode=1777");
    expect(executeArgs).toContain("-w");
    expect(executeArgs).toContain("/sandbox");
    expect(executeArgs).toContain("--entrypoint");
    expect(executeArgs).toContain("/workspace/program");
  });

  it("includes resource limits", () => {
    const compileArgs = buildCompileDockerArgs({
      containerName: "cfund-compile-test",
      hostWorkspacePath: "/tmp/workspace",
      gccArgs: ["main.c"],
    });
    const executeArgs = buildExecuteDockerArgs({
      containerName: "cfund-run-test",
      hostWorkspacePath: "/tmp/workspace",
    });

    expect(compileArgs).toContain("--pids-limit");
    expect(compileArgs).toContain("--memory");
    expect(compileArgs).toContain("--cpus");
    expect(executeArgs).toContain("--pids-limit");
    expect(executeArgs).toContain("--memory");
    expect(executeArgs).toContain("--cpus");
  });

  it("invokes gcc directly without shell wrappers", () => {
    const compileArgs = buildCompileDockerArgs({
      containerName: "cfund-compile-test",
      hostWorkspacePath: "/tmp/workspace",
      gccArgs: ["-std=c17", "main.c", "-o", "program"],
    });

    expect(compileArgs).toContain("gcc");
    expect(compileArgs).not.toContain("sh");
    expect(compileArgs).not.toContain("bash");
    expect(compileArgs).not.toContain("-c");
  });
});
