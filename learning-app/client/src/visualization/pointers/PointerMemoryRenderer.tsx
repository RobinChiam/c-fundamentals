import { MemoryCell } from "../memory/MemoryCell";
import { MemoryLegend } from "../memory/MemoryLegend";
import { PointerArrow } from "../memory/PointerArrow";
import { UndefinedBehaviorNotice } from "../memory/UndefinedBehaviorNotice";
import type { PointerStep } from "./pointer-traces";

interface PointerMemoryRendererProps {
  step: PointerStep;
  reducedMotion?: boolean;
}

export function PointerMemoryRenderer({
  step,
  reducedMotion = false,
}: PointerMemoryRendererProps) {
  const variableById = new Map(step.variables.map((variable) => [variable.id, variable]));

  return (
    <div className="space-y-4">
      {step.undefinedBehavior ? (
        <UndefinedBehaviorNotice state={step.undefinedBehavior} />
      ) : null}

      <div className="flex min-w-full flex-wrap items-start gap-4 pb-2">
        {step.variables.map((variable) => (
          <MemoryCell
            key={variable.id}
            name={variable.name}
            type={variable.type}
            addressSlot={variable.addressSlot}
            value={variable.value}
            valueState={variable.valueState}
            valueLabel={variable.valueLabel}
            highlight={step.activeIds.includes(variable.id)}
          />
        ))}

        {step.pointers.map((pointer) => {
          const target = pointer.pointsTo ? variableById.get(pointer.pointsTo) : null;
          const textEquivalent = pointer.isNull
            ? `${pointer.name} is NULL (no target)`
            : pointer.pointsToLabel && !target
              ? `${pointer.name} at one-past boundary (no dereference)`
              : target
                ? `${pointer.name} points to ${target.name}`
                : `${pointer.name} has no valid target`;

          return (
            <div key={pointer.id} className="flex items-center gap-2">
              <MemoryCell
                name={pointer.name}
                type={pointer.type}
                addressSlot={pointer.addressSlot}
                value={null}
                valueState={pointer.isDangling ? "invalid" : "initialized"}
                valueLabel={
                  pointer.isNull
                    ? "NULL"
                    : target
                      ? `→ ${target.name}`
                      : pointer.pointsToLabel ?? "?"
                }
                highlight={step.activeIds.includes(pointer.id)}
              />
              {target ? (
                <PointerArrow
                  fromLabel={pointer.name}
                  toLabel={target.name}
                  textEquivalent={textEquivalent}
                  highlight={step.activeIds.includes(pointer.id)}
                />
              ) : (
                <p className="max-w-xs text-xs text-slate-700">{textEquivalent}</p>
              )}
            </div>
          );
        })}
      </div>

      <MemoryLegend />
      {reducedMotion ? (
        <p className="text-xs text-slate-600">Reduced motion: transitions minimized.</p>
      ) : null}
    </div>
  );
}
