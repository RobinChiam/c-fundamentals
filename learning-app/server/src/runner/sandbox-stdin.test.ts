import { describe, expect, it } from "vitest";
import { MAX_STDIN_BYTES } from "./runner-config.js";
import { normalizeSandboxStdin } from "./sandbox-stdin.js";

describe("normalizeSandboxStdin", () => {
  it("leaves empty stdin unchanged", () => {
    expect(normalizeSandboxStdin("")).toBe("");
  });

  it("appends a newline to a single typed value", () => {
    expect(normalizeSandboxStdin("5")).toBe("5\n");
  });

  it("does not add a second newline when Enter is already present", () => {
    expect(normalizeSandboxStdin("5\n")).toBe("5\n");
    expect(normalizeSandboxStdin("1\n2\n")).toBe("1\n2\n");
  });

  it("does not grow stdin that is already at the size limit", () => {
    const stdin = "x".repeat(MAX_STDIN_BYTES);
    expect(normalizeSandboxStdin(stdin)).toBe(stdin);
  });
});
