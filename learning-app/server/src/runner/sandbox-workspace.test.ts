import { mkdtemp, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  SANDBOX_WORKSPACE_DIR_MODE,
  SANDBOX_WORKSPACE_FILE_MODE,
  makeSandboxWorkspaceAccessible,
  writeSandboxWorkspaceFile,
} from "./sandbox-workspace.js";

describe("sandbox workspace permissions", () => {
  const cleanupDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(
      cleanupDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
    );
  });

  it("opens mkdtemp directories so capability-dropped containers can access them", async () => {
    const workspaceDir = await mkdtemp(
      path.join(os.tmpdir(), "c-fundamentals-sandbox-"),
    );
    cleanupDirs.push(workspaceDir);

    const before = await stat(workspaceDir);
    expect(before.mode & 0o0777).toBe(0o0700);

    await makeSandboxWorkspaceAccessible(workspaceDir);

    const after = await stat(workspaceDir);
    expect(after.mode & 0o0777).toBe(SANDBOX_WORKSPACE_DIR_MODE);
  });

  it("creates workspace files as world-readable", async () => {
    const workspaceDir = await mkdtemp(
      path.join(os.tmpdir(), "c-fundamentals-sandbox-"),
    );
    cleanupDirs.push(workspaceDir);

    const filePath = path.join(workspaceDir, "shapes.c");
    await writeSandboxWorkspaceFile(
      filePath,
      "int main(void) { return 0; }\n",
    );

    const fileStat = await stat(filePath);
    expect(fileStat.mode & 0o0777).toBe(SANDBOX_WORKSPACE_FILE_MODE);
  });
});
