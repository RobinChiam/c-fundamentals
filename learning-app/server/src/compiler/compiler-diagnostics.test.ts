import { describe, expect, it } from "vitest";
import {
  parseGccDiagnostics,
  sanitizeCompilerOutput,
} from "./compiler-diagnostics.js";

describe("compiler diagnostics parser", () => {
  const context = {
    fileNameToId: new Map([
      ["arrays.c", "primary"],
      ["geometry.c", "geometry"],
    ]),
  };

  it("parses error lines", () => {
    const diagnostics = parseGccDiagnostics(
      "arrays.c:15:5: error: expected ';' before '}' token",
      context,
    );

    expect(diagnostics).toEqual([
      {
        severity: "error",
        fileName: "arrays.c",
        fileId: "primary",
        line: 15,
        column: 5,
        message: "expected ';' before '}' token",
      },
    ]);
  });

  it("parses warning lines with options", () => {
    const diagnostics = parseGccDiagnostics(
      "arrays.c:8:9: warning: unused variable 'x' [-Wunused-variable]",
      context,
    );

    expect(diagnostics).toEqual([
      {
        severity: "warning",
        fileName: "arrays.c",
        fileId: "primary",
        line: 8,
        column: 9,
        message: "unused variable 'x'",
        option: "unused-variable",
      },
    ]);
  });

  it("parses note lines", () => {
    const diagnostics = parseGccDiagnostics(
      "geometry.c:22:3: note: declared here",
      context,
    );

    expect(diagnostics[0]?.severity).toBe("note");
    expect(diagnostics[0]?.fileId).toBe("geometry");
  });

  it("maps fileName back to fileId", () => {
    const diagnostics = parseGccDiagnostics(
      "geometry.c:1:1: error: unknown type name 'Circle'",
      context,
    );

    expect(diagnostics[0]?.fileId).toBe("geometry");
  });

  it("ignores unrecognized linker lines without crashing", () => {
    const stderr = [
      "arrays.c:1:1: error: expected identifier",
      "/usr/bin/ld: cannot find -lmagic",
      "collect2: error: ld returned 1 exit status",
    ].join("\n");

    expect(() => parseGccDiagnostics(stderr, context)).not.toThrow();
    expect(parseGccDiagnostics(stderr, context)).toHaveLength(1);
  });

  it("preserves raw output outside parser responsibility", () => {
    const raw = "arrays.c:1:1: error: bad token\nlinker noise";
    const diagnostics = parseGccDiagnostics(raw, context);
    expect(diagnostics).toHaveLength(1);
    expect(raw).toContain("linker noise");
  });

  it("sanitizes temp workspace prefixes from output", () => {
    const tempPath = "/tmp/c-fundamentals-compile-abc123";
    const sanitized = sanitizeCompilerOutput(
      `${tempPath}/arrays.c:1:1: error: syntax error`,
      tempPath,
    );

    expect(sanitized).toBe("arrays.c:1:1: error: syntax error");
  });
});
