export const DEFAULT_BODY_LIMIT_BYTES = 512 * 1024;
export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

export interface HttpConfig {
  bodyLimitBytes: number;
  requestTimeoutMs: number;
}

export function resolveHttpConfig(): HttpConfig {
  return {
    bodyLimitBytes: DEFAULT_BODY_LIMIT_BYTES,
    requestTimeoutMs: DEFAULT_REQUEST_TIMEOUT_MS,
  };
}
