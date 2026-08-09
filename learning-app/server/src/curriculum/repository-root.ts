import path from "node:path";
import { fileURLToPath } from "node:url";

export function resolveDefaultRepositoryRoot(): string {
  const serverSrcDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(serverSrcDir, "../../../..");
}
