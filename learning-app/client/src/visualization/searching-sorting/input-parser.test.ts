import { describe, expect, it } from "vitest";
import {
  formatArrayInput,
  isAscendingSorted,
  parseArrayInput,
  parseTargetInput,
  sortAscending,
} from "./input-parser";

describe("parseArrayInput", () => {
  it("parses basic comma-separated input", () => {
    expect(parseArrayInput("42, 7, 19")).toEqual({
      ok: true,
      values: [42, 7, 19],
    });
  });

  it("parses whitespace", () => {
    expect(parseArrayInput("  1 ,  2 ,3 ")).toEqual({
      ok: true,
      values: [1, 2, 3],
    });
  });

  it("parses negative values", () => {
    expect(parseArrayInput("-5, 10, -999")).toEqual({
      ok: true,
      values: [-5, 10, -999],
    });
  });

  it("parses zero", () => {
    expect(parseArrayInput("0, 0, 1")).toEqual({
      ok: true,
      values: [0, 0, 1],
    });
  });

  it("rejects empty middle element", () => {
    const result = parseArrayInput("1,,2");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/empty/i);
    }
  });

  it("rejects non-integer", () => {
    const result = parseArrayInput("hello");
    expect(result.ok).toBe(false);
  });

  it("rejects decimals", () => {
    const result = parseArrayInput("1.5, 2");
    expect(result.ok).toBe(false);
  });

  it("rejects out-of-range values", () => {
    const result = parseArrayInput("1000");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/out of range/i);
    }
  });

  it("rejects too many values", () => {
    const values = Array.from({ length: 21 }, (_, index) => String(index)).join(",");
    const result = parseArrayInput(values);
    expect(result.ok).toBe(false);
  });

  it("handles empty input deterministically", () => {
    expect(parseArrayInput("")).toEqual({ ok: true, values: [] });
    expect(parseArrayInput("   ")).toEqual({ ok: true, values: [] });
  });

  it("rejects mixed invalid tokens", () => {
    expect(parseArrayInput("1, two, 3").ok).toBe(false);
  });
});

describe("parseTargetInput", () => {
  it("accepts valid target", () => {
    expect(parseTargetInput("19")).toEqual({ ok: true, values: [19] });
  });

  it("rejects invalid target", () => {
    expect(parseTargetInput("abc").ok).toBe(false);
  });
});

describe("sort helpers", () => {
  it("detects ascending order", () => {
    expect(isAscendingSorted([1, 2, 3])).toBe(true);
    expect(isAscendingSorted([3, 1, 2])).toBe(false);
  });

  it("sorts ascending without mutating input", () => {
    const input = [42, 7, 19];
    expect(sortAscending(input)).toEqual([7, 19, 42]);
    expect(input).toEqual([42, 7, 19]);
  });

  it("formats array input", () => {
    expect(formatArrayInput([1, 2, 3])).toBe("1, 2, 3");
  });
});
