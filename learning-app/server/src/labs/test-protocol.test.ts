import { describe, expect, it } from "vitest";
import { buildProtocolLine, parseProtocolResults } from "./test-protocol.js";

describe("lab test protocol", () => {
  it("parses only matching token lines", () => {
    const token = "abc123";
    const stdout = [
      "noise from learner",
      buildProtocolLine(token, "leap-ordinary-leap", true),
      "wrongtoken TEST fake-id PASS",
      buildProtocolLine(token, "leap-century", false),
    ].join("\n");

    const results = parseProtocolResults(stdout, token);
    expect(results.get("leap-ordinary-leap")).toBe(true);
    expect(results.get("leap-century")).toBe(false);
    expect(results.has("fake-id")).toBe(false);
  });
});
