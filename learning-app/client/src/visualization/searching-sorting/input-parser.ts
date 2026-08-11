export const MAX_ARRAY_LENGTH = 20;
export const MIN_VALUE = -999;
export const MAX_VALUE = 999;

export type ParseArrayInputResult =
  | { ok: true; values: number[] }
  | { ok: false; error: string };

function isValidIntegerToken(token: string): boolean {
  if (token.length === 0) {
    return false;
  }
  if (token.includes(".")) {
    return false;
  }
  const value = Number(token);
  if (!Number.isInteger(value)) {
    return false;
  }
  return value >= MIN_VALUE && value <= MAX_VALUE;
}

export function parseArrayInput(input: string): ParseArrayInputResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: true, values: [] };
  }

  const parts = trimmed.split(",");
  const values: number[] = [];

  for (const part of parts) {
    const token = part.trim();
    if (token.length === 0) {
      return { ok: false, error: "Empty values are not allowed between commas." };
    }
    if (!/^-?\d+$/.test(token)) {
      return { ok: false, error: `"${token}" is not a valid integer.` };
    }
    if (!isValidIntegerToken(token)) {
      const value = Number(token);
      if (!Number.isInteger(value)) {
        return { ok: false, error: `"${token}" is not a valid integer.` };
      }
      return {
        ok: false,
        error: `Value ${value} is out of range (${MIN_VALUE} to ${MAX_VALUE}).`,
      };
    }
    values.push(Number(token));
  }

  if (values.length > MAX_ARRAY_LENGTH) {
    return {
      ok: false,
      error: `At most ${MAX_ARRAY_LENGTH} values are allowed.`,
    };
  }

  return { ok: true, values };
}

export function isAscendingSorted(values: number[]): boolean {
  for (let i = 1; i < values.length; i += 1) {
    if (values[i]! < values[i - 1]!) {
      return false;
    }
  }
  return true;
}

export function sortAscending(values: number[]): number[] {
  return [...values].sort((left, right) => left - right);
}

export function generateRandomArray(length = 6): number[] {
  const count = Math.min(Math.max(1, length), MAX_ARRAY_LENGTH);
  const values: number[] = [];
  for (let i = 0; i < count; i += 1) {
    values.push(
      Math.floor(Math.random() * (MAX_VALUE - MIN_VALUE + 1)) + MIN_VALUE,
    );
  }
  return values;
}

export function formatArrayInput(values: number[]): string {
  return values.join(", ");
}

export function parseTargetInput(input: string): ParseArrayInputResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "Target is required." };
  }
  if (!/^-?\d+$/.test(trimmed)) {
    return { ok: false, error: "Target must be an integer." };
  }
  const value = Number(trimmed);
  if (!Number.isInteger(value)) {
    return { ok: false, error: "Target must be an integer." };
  }
  if (value < MIN_VALUE || value > MAX_VALUE) {
    return {
      ok: false,
      error: `Target must be between ${MIN_VALUE} and ${MAX_VALUE}.`,
    };
  }
  return { ok: true, values: [value] };
}
