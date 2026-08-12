export const DEFAULT_HOST = "127.0.0.1";
export const DEFAULT_PORT = 3001;

const MIN_PORT = 1;
const MAX_PORT = 65535;

export interface ServerConfig {
  host: string;
  port: number;
  isProduction: boolean;
  clientDistPath?: string;
}

function parsePort(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim().length === 0) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (
    Number.isNaN(parsed) ||
    parsed < MIN_PORT ||
    parsed > MAX_PORT ||
    String(parsed) !== value.trim()
  ) {
    throw new Error(`Invalid port: ${value}`);
  }

  return parsed;
}

export function resolveServerConfig(
  env: NodeJS.ProcessEnv = process.env,
): ServerConfig {
  const host = env.LEARNING_APP_HOST?.trim() || DEFAULT_HOST;
  const port = parsePort(env.LEARNING_APP_PORT, DEFAULT_PORT);
  const isProduction = env.NODE_ENV === "production";

  return {
    host,
    port,
    isProduction,
    clientDistPath: env.LEARNING_APP_CLIENT_DIST?.trim() || undefined,
  };
}

export function isLoopbackHost(host: string): boolean {
  return host === "127.0.0.1" || host === "localhost" || host === "::1";
}
