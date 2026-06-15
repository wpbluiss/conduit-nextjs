"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { EmployeeAvatar, DEPT_COLOR, employeeLabel, SpecialistChip } from "./EmployeeBadge";
import type { EmployeeKey } from "@/lib/ai/provider";

// Contextual mono micro-copy per specialist — shown while waiting for first token.
const THINKING_STATUS: Record<EmployeeKey, string> = {
  jarvis:      "routing to your team…",
  marketing:   "reviewing your brief…",
  engineering: "analyzing the problem…",
  sales:       "building the play…",
  finance:     "reviewing the numbers…",
  compliance:  "checking requirements…",
  hr:          "reviewing your request…",
  ops:         "mapping the process…",
  legal:       "reviewing the brief…",
};

// Per-dot framer-motion variants — stagger is applied via delay in transition
const dotVariants = {
  pulse: (i: number) => ({
    scale: [0.82, 1, 1, 0.82],
    opacity: [0.2, 1, 1, 0.2],
    transition: {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      repeat: Infinity,
      delay: i * 0.18,
    },
  }),
};

export function TypingIndicator({
  employee,
  roundTable = false,
}: {
  employee: EmployeeKey;
  roundTable?: boolean;
}) {
  const reducedMotion = useReducedMotion();
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
        <EmployeeAvatar employee={employee} size={32} active />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <SpecialistChip employee={employee} />
        <div
          role="status"
          aria-live="polite"
          aria-label={`${name} is responding`}
          className="thinking-bubble inline-flex flex-col gap-2 px-4 py-3"
        >
          {reducedMotion ? (
            /* prefers-reduced-motion: static "thinking…" label, no animation */
            <span className="thinking-status">{statusText}</span>
          ) : (
            <>
              {/* Three pulsing dots — framer-motion stagger */}
              <div className="flex items-center gap-1.5" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    custom={i}
                    variants={dotVariants}
                    animate="pulse"
                    style={{
                      display: "inline-block",
                      width: 7,
                      height: 7,
                      borderRadius: 9999,
                      background: "var(--dept, var(--cx-accent, #7C6CFF))",
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
              {/* Mono status micro-copy */}
              <span className="thinking-status" aria-hidden="true">
                {statusText}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
