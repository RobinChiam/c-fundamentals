export type MemoryValueState = "initialized" | "uninitialized" | "zero" | "invalid";

export interface MemoryVariable {
  id: string;
  name: string;
  type: string;
  addressSlot: number;
  value: number | null;
  valueState: MemoryValueState;
  valueLabel?: string;
}

export interface PointerVariable {
  id: string;
  name: string;
  type: string;
  addressSlot: number;
  pointsTo: string | null;
  pointsToLabel?: string;
  isNull: boolean;
  isDangling?: boolean;
}

export interface HeapAllocation {
  id: string;
  label: string;
  slotCount: number;
  values: (number | null)[];
  valueStates: MemoryValueState[];
  lifetime: "live" | "freed" | "leaked";
  ownerPointerIds: string[];
}

export interface UndefinedBehaviorState {
  kind:
    | "null-dereference"
    | "use-after-free"
    | "double-free"
    | "invalid-index";
  message: string;
}
