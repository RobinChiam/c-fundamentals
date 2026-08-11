interface StepCounterProps {
  currentStep: number;
  totalSteps: number;
}

export function StepCounter({ currentStep, totalSteps }: StepCounterProps) {
  return (
    <p
      aria-live="polite"
      className="text-sm font-medium text-slate-700"
      aria-label={`Step ${currentStep} of ${totalSteps}`}
    >
      Step {currentStep} of {totalSteps}
    </p>
  );
}
