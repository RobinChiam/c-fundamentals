import { CallStackRenderer } from "./CallStackRenderer";
import type { FunctionStep } from "./function-traces";

interface FunctionStepViewProps {
  step: FunctionStep;
  reducedMotion?: boolean;
}

export function FunctionStepView({ step, reducedMotion = false }: FunctionStepViewProps) {
  return (
    <CallStackRenderer
      frames={step.frames}
      callerVars={step.callerVars}
      activeFrameId={step.activeFrameId}
      reducedMotion={reducedMotion}
    />
  );
}
