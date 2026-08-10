import { describe, expect, it } from "vitest";
import { DEFAULT_HOST } from "./server.js";

describe("server defaults", () => {
  it("binds to loopback by default", () => {
    expect(DEFAULT_HOST).toBe("127.0.0.1");
  });
});
