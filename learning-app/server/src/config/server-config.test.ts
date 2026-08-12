import { describe, expect, it } from "vitest";
import {
  DEFAULT_HOST,
  DEFAULT_PORT,
  isLoopbackHost,
  resolveServerConfig,
} from "./server-config.js";

describe("server config", () => {
  it("defaults to loopback host and port 3001", () => {
    const config = resolveServerConfig({});
    expect(config.host).toBe(DEFAULT_HOST);
    expect(config.port).toBe(DEFAULT_PORT);
    expect(config.isProduction).toBe(false);
  });

  it("rejects invalid ports", () => {
    expect(() =>
      resolveServerConfig({ LEARNING_APP_PORT: "70000" }),
    ).toThrow(/invalid port/i);
  });

  it("detects loopback hosts", () => {
    expect(isLoopbackHost("127.0.0.1")).toBe(true);
    expect(isLoopbackHost("localhost")).toBe(true);
    expect(isLoopbackHost("0.0.0.0")).toBe(false);
  });
});
