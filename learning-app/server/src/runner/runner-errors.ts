export class RunnerUnavailableError extends Error {
  constructor(message = "Program runner is not available") {
    super(message);
    this.name = "RunnerUnavailableError";
  }
}

export class RunInternalError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, cause instanceof Error ? { cause } : undefined);
    this.name = "RunInternalError";
  }
}
