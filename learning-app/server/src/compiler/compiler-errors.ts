export class CompilerUnavailableError extends Error {
  constructor(message = "GCC is not available") {
    super(message);
    this.name = "CompilerUnavailableError";
  }
}

export class InvalidWorkspaceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidWorkspaceError";
  }
}

export class PayloadTooLargeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PayloadTooLargeError";
  }
}

export class CompileInternalError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, cause instanceof Error ? { cause } : undefined);
    this.name = "CompileInternalError";
  }
}
