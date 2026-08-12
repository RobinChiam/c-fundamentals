import { describe, expect, it } from "vitest";
import { createExecutionGate, withExecutionGate } from "./execution-gate.js";

describe("execution gate", () => {
  it("allows acquire up to capacity", () => {
    const gate = createExecutionGate(2);
    expect(gate.tryAcquire()).toBe(true);
    expect(gate.tryAcquire()).toBe(true);
    expect(gate.tryAcquire()).toBe(false);
    expect(gate.active).toBe(2);
  });

  it("releases capacity after success", async () => {
    const gate = createExecutionGate(1);
    await withExecutionGate(gate, async () => "ok");
    expect(gate.active).toBe(0);
    expect(gate.tryAcquire()).toBe(true);
    gate.release();
  });

  it("releases capacity after failure", async () => {
    const gate = createExecutionGate(1);
    expect(gate.tryAcquire()).toBe(true);
    gate.release();

    await expect(
      withExecutionGate(gate, async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    expect(gate.active).toBe(0);
  });

  it("does not release below zero", () => {
    const gate = createExecutionGate(1);
    gate.release();
    gate.release();
    expect(gate.active).toBe(0);
  });

  it("rejects when capacity is exhausted", async () => {
    const gate = createExecutionGate(1);
    expect(gate.tryAcquire()).toBe(true);

    await expect(
      withExecutionGate(gate, async () => "blocked"),
    ).rejects.toThrow(/capacity is currently full/i);

    gate.release();
    expect(gate.active).toBe(0);
  });
});
