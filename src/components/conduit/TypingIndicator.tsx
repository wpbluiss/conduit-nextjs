"use client";

import { DEPT_COLOR, employeeLabel, SpecialistChip } from "./EmployeeBadge";
import { SpecialistAvatar } from "./SpecialistAvatar";
import type { EmployeeKey } from "@/lib/ai/provider";

// Contextual mono micro-copy per specialist — shown while waiting for first token.
const THINKING_STATUS: Record<EmployeeKey, string> = {
  jarvis:     "routing to your team…",
  marketing:  "reviewing your brief…",
  engineering:"analyzing the problem…",
  sales:      "building the play…",
  finance:    "reviewing the numbers…",
  compliance: "checking requirements…",
  hr:         "reviewing your request…",
  ops:        "mapping the process…",
  legal:      "reviewing the brief…",
};

export function TypingIndicator({
  employee,
  roundTable = false,
}: {
  employee: EmployeeKey;
  roundTable?: boolean;
}) {
  const name = employeeLabel(employee);
  const deptColor = DEPT_COLOR[employee];
  const statusText = roundTable
    ? "contributing to the discussion…"
    : (THINKING_STATUS[employee] ?? "thinking…");

  return (
    <div
      className="flex gap-3"
      style={{ ["--dept" as string]: deptColor }}
    >
      <div className="pt-1 shrink-0">
        <SpecialistAvatar employee={employee} size={32} streaming />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <SpecialistChip employee={employee} />
        <div
          role="status"
          aria-live="polite"
          aria-label={`${name} is responding`}
          className="thinking-bubble inline-flex flex-col gap-2 px-4 py-3"
        >
          {/* Pulsing dots indicator */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="thinking-dot" />
            <span className="thinking-dot" />
            <span className="thinking-dot" />
          </div>
          {/* Mono status micro-copy */}
          <span className="thinking-status" aria-hidden="true">
            {statusText}
          </span>
        </div>
      </div>
    </div>
  );
}
