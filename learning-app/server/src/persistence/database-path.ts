import path from "node:path";
import { fileURLToPath } from "node:url";

export function resolveDefaultDatabasePath(): string {
  const configured = process.env.LEARNING_APP_DATABASE_PATH?.trim();
  if (configured) {
    return path.resolve(configured);
  }

  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(moduleDir, "../../../.data/learning-lab.sqlite3");
}
