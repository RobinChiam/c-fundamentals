import path from "node:path";
import { fileURLToPath } from "node:url";

export function resolveDefaultDatabasePath(): string {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(moduleDir, "../../../.data/learning-lab.sqlite3");
}
