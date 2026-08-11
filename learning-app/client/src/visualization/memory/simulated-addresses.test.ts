import { describe, expect, it } from "vitest";
import {
  formatSimulatedAddress,
  simulatedAddressLabel,
  SIMULATED_ADDRESS_PREFIX,
} from "./simulated-addresses";

describe("simulated-addresses", () => {
  it("produces deterministic addresses", () => {
    expect(formatSimulatedAddress(0)).toBe("0x1000");
    expect(formatSimulatedAddress(1)).toBe("0x1004");
    expect(formatSimulatedAddress(2)).toBe("0x1008");
    expect(formatSimulatedAddress(0)).toBe(formatSimulatedAddress(0));
  });

  it("labels addresses as simulated", () => {
    expect(simulatedAddressLabel(0)).toContain(SIMULATED_ADDRESS_PREFIX);
    expect(simulatedAddressLabel(0)).toContain("0x1000");
  });
});
