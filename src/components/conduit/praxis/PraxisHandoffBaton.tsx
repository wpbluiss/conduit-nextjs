"use client";

import type { EmployeeId } from "@/lib/conduit/employees";
import { EMPLOYEES } from "@/lib/conduit/employees";
import { PraxisAvatar } from "./PraxisAvatar";

interface Props {
  from: EmployeeId;
  to: EmployeeId;
  label?: string;
}

/**
 * Replacement for the existing .handoff-card. Animates left-edge color
 * from the outgoing employee's color to the incoming employee's color
 * over 480ms via the praxis-baton keyframe.
 *
 * Per contracts/primitives.md P-009. Reduced-motion: renders the end
 * state only (right-edge --to color).
 */
export function PraxisHandoffBaton({ from, to, label }: Props) {
  const fromMeta = EMPLOYEES[from];
  const toMeta = EMPLOYEES[to];
  return (
    <div
      className="praxis-handoff-baton"
      style={{
        ["--from" as string]: `var(--color-dept-${from})`,
        ["--to" as string]: `var(--color-dept-${to})`,
      }}
      role="status"
      aria-label={label ?? `${fromMeta.name} handing off to ${toMeta.name}`}
    >
      <PraxisAvatar employee={from} size="md" />
      <span className="praxis-eyebrow">
        {label ?? `${fromMeta.name} → ${toMeta.name}`}
      </span>
      <PraxisAvatar employee={to} size="md" />
    </div>
  );
}
