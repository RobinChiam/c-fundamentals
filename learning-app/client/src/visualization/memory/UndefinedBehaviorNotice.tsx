import type { UndefinedBehaviorState } from "./memory-types";

interface UndefinedBehaviorNoticeProps {
  state: UndefinedBehaviorState;
}

export function UndefinedBehaviorNotice({ state }: UndefinedBehaviorNoticeProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900"
    >
      <p className="font-semibold">Undefined behavior</p>
      <p className="mt-1">{state.message}</p>
      <p className="mt-2 text-red-800">
        The visualizer stops here rather than fabricating a result. Real programs may
        crash, corrupt memory, or appear to work — all are undefined.
      </p>
    </div>
  );
}
