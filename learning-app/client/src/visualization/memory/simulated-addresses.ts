const BASE_ADDRESS = 0x1000;
const ADDRESS_STRIDE = 4;

export function formatSimulatedAddress(slot: number): string {
  const value = BASE_ADDRESS + slot * ADDRESS_STRIDE;
  return `0x${value.toString(16).toUpperCase()}`;
}

export const SIMULATED_ADDRESS_PREFIX = "simulated address";

export function simulatedAddressLabel(slot: number): string {
  return `${SIMULATED_ADDRESS_PREFIX} ${formatSimulatedAddress(slot)}`;
}

export function nextAddressSlot(startSlot: number, count: number): number {
  return startSlot + count;
}
