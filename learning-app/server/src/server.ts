import { fileURLToPath } from "node:url";
import { buildApp } from "./app.js";

const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_PORT = 3001;

export async function startServer(
  host = DEFAULT_HOST,
  port = DEFAULT_PORT,
): Promise<void> {
  const app = await buildApp();

  try {
    await app.listen({ host, port });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  void startServer();
}
