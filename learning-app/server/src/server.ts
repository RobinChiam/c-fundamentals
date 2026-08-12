import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildApp } from "./app.js";
import {
  DEFAULT_HOST,
  DEFAULT_PORT,
  isLoopbackHost,
  resolveServerConfig,
} from "./config/server-config.js";
import { registerProcessSignalHandlers } from "./shutdown/graceful-shutdown.js";

export { DEFAULT_HOST, DEFAULT_PORT };

function resolveDefaultClientDistPath(): string {
  const serverDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(serverDir, "../../client/dist");
}

export interface StartServerOptions {
  host?: string;
  port?: number;
  serveStatic?: boolean;
  clientDistPath?: string;
  enableSecurityHeaders?: boolean;
  registerSignalHandlers?: boolean;
}

export async function startServer(
  options: StartServerOptions = {},
): Promise<ReturnType<typeof buildApp>> {
  const config = resolveServerConfig();
  const host = options.host ?? config.host;
  const port = options.port ?? config.port;
  const serveStatic = options.serveStatic ?? config.isProduction;
  const clientDistPath =
    options.clientDistPath ?? config.clientDistPath ?? resolveDefaultClientDistPath();

  const app = await buildApp({
    serveStatic,
    clientDistPath,
    enableSecurityHeaders: options.enableSecurityHeaders ?? config.isProduction,
    registerSignalHandlers: options.registerSignalHandlers,
  });

  if (!isLoopbackHost(host)) {
    console.warn(
      "WARNING: Binding to a non-loopback host. External exposure is unsupported without additional security controls.",
    );
  }

  try {
    await app.listen({ host, port });
  } catch (error) {
    console.error("Failed to start server:", error);
    await app.shutdownManager.runShutdown();
    process.exit(1);
  }

  const protocol = "http";
  console.log(`Learning Lab server listening on ${protocol}://${host}:${port}`);

  if (serveStatic) {
    console.log(`Serving production frontend from ${clientDistPath}`);
  }

  registerProcessSignalHandlers(
    app.shutdownManager,
    async () => {
      // Shutdown handlers registered during buildApp perform cleanup.
    },
    { registerSignals: options.registerSignalHandlers !== false },
  );

  return app;
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  void startServer();
}
