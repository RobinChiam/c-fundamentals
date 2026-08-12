export class ExecutionBusyError extends Error {
  constructor(message = "Execution capacity is currently full. Try again shortly.") {
    super(message);
    this.name = "ExecutionBusyError";
  }
}

export interface ExecutionGate {
  tryAcquire(): boolean;
  release(): void;
  readonly active: number;
  readonly capacity: number;
}

export function createExecutionGate(capacity: number): ExecutionGate {
  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new Error("Execution gate capacity must be a positive integer");
  }

  let active = 0;

  return {
    get active() {
      return active;
    },
    get capacity() {
      return capacity;
    },
    tryAcquire(): boolean {
      if (active >= capacity) {
        return false;
      }
      active += 1;
      return true;
    },
    release(): void {
      if (active <= 0) {
        return;
      }
      active -= 1;
    },
  };
}

export async function withExecutionGate<T>(
  gate: ExecutionGate,
  operation: () => Promise<T>,
): Promise<T> {
  if (!gate.tryAcquire()) {
    throw new ExecutionBusyError();
  }

  try {
    return await operation();
  } finally {
    gate.release();
  }
}
