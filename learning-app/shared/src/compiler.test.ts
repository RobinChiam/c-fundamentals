import { describe, expect, it } from "vitest";
import {
  compileRequestSchema,
  compileResponseSchema,
  compilerDiagnosticSchema,
  compilerStatusSchema,
} from "./compiler.js";

describe("compiler contracts", () => {
  it("validates compiler status", () => {
    expect(
      compilerStatusSchema.parse({
        available: true,
        compiler: "gcc",
        version: "gcc (GCC) 14.2.1 20240912",
      }),
    ).toEqual({
      available: true,
      compiler: "gcc",
      version: "gcc (GCC) 14.2.1 20240912",
    });
  });

  it("validates compile request", () => {
    expect(
      compileRequestSchema.parse({
        files: [{ id: "primary", content: "int main(void) { return 0; }" }],
      }),
    ).toEqual({
      files: [{ id: "primary", content: "int main(void) { return 0; }" }],
    });
  });

  it("validates compile response", () => {
    const response = compileResponseSchema.parse({
      outcome: "failed",
      exitCode: 1,
      stdout: "",
      stderr: "arrays.c:1:1: error: expected identifier",
      stdoutTruncated: false,
      stderrTruncated: false,
      diagnostics: [
        {
          severity: "error",
          fileName: "arrays.c",
          fileId: "primary",
          line: 1,
          column: 1,
          message: "expected identifier",
        },
      ],
    });

    expect(compilerDiagnosticSchema.parse(response.diagnostics[0])).toEqual(
      response.diagnostics[0],
    );
  });
});
