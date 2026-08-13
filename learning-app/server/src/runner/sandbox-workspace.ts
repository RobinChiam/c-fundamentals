import { chmod, writeFile } from "node:fs/promises";

/**
 * mkdtemp() creates 0700 directories. Sandbox containers run with
 * `--cap-drop ALL`, so even uid 0 cannot bypass DAC. World-writable lets
 * gcc write the binary and the nobody execute user traverse the mount.
 */
export const SANDBOX_WORKSPACE_DIR_MODE = 0o0777;
export const SANDBOX_WORKSPACE_FILE_MODE = 0o0644;

export async function writeSandboxWorkspaceFile(
  filePath: string,
  content: string,
): Promise<void> {
  await writeFile(filePath, content, "utf8");
  await chmod(filePath, SANDBOX_WORKSPACE_FILE_MODE);
}

export async function makeSandboxWorkspaceAccessible(
  workspaceDir: string,
): Promise<void> {
  await chmod(workspaceDir, SANDBOX_WORKSPACE_DIR_MODE);
}
