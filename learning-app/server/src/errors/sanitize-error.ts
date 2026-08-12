const ABSOLUTE_PATH_PATTERN =
  /(?:\/(?:[\w.-]+(?:\/|$))+)|(?:[A-Za-z]:\\(?:[\w.-]+\\?)+)/gu;

export function sanitizeClientErrorMessage(message: string): string {
  return message
    .replace(ABSOLUTE_PATH_PATTERN, "[path]")
    .replace(/\bat\s+.+\(.+\)/gu, "")
    .trim();
}

export function sanitizeProductionError(error: unknown): string {
  if (error instanceof Error) {
    return sanitizeClientErrorMessage(error.message) || "Internal server error";
  }
  return "Internal server error";
}
