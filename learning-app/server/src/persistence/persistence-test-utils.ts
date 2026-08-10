import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createDatabase } from "./database.js";

export function createTempDatabaseDirectory(): string {
  return mkdtempSync(path.join(os.tmpdir(), "learning-lab-test-"));
}

export function createTempDatabase(): {
  databasePath: string;
  tempDirectory: string;
  db: ReturnType<typeof createDatabase>["db"];
  close: () => void;
  cleanup: () => void;
} {
  const tempDirectory = createTempDatabaseDirectory();
  const databasePath = path.join(tempDirectory, "test.sqlite3");
  const database = createDatabase({ databasePath });

  return {
    databasePath,
    tempDirectory,
    db: database.db,
    close: () => database.close(),
    cleanup: () => {
      database.close();
      rmSync(tempDirectory, { recursive: true, force: true });
    },
  };
}

export function reopenTempDatabase(databasePath: string): {
  close: () => void;
  db: ReturnType<typeof createDatabase>["db"];
} {
  const database = createDatabase({ databasePath });
  return {
    db: database.db,
    close: () => database.close(),
  };
}
