"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DEPT_COLOR, employeeLabel, SpecialistChip } from "./EmployeeBadge";
import { SpecialistAvatar } from "./SpecialistAvatar";
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

// Routing micro-copy shown when Atlas has determined which specialist to route to.
const ROUTING_TO_STATUS: Partial<Record<EmployeeKey, string>> = {
  marketing:   "routing to Marketing…",
  engineering: "routing to Engineering…",
  sales:       "routing to Sales…",
  finance:     "routing to Finance…",
  compliance:  "routing to Compliance…",
  hr:          "routing to HR…",
  ops:         "routing to Operations…",
  legal:       "routing to Legal…",
};

export function TypingIndicator({
  employee,
  roundTable = false,
  isActive = true,
  routingTarget = null,
}: {
  employee: EmployeeKey;
  roundTable?: boolean;
  /** false = another specialist is active; this one is waiting its turn (round-table only) */
  isActive?: boolean;
  /** When Atlas has resolved routing, shows "routing to Engineering…" instead of the generic copy. */
  routingTarget?: EmployeeKey | null;
}) {
  const reduced = useReducedMotion();
  const name = employeeLabel(employee);
  const deptColor = DEPT_COLOR[employee];

  const statusText = !isActive
    ? "waiting…"
    : routingTarget && employee === "jarvis"
    ? (ROUTING_TO_STATUS[routingTarget] ?? `routing to ${employeeLabel(routingTarget)}…`)
    : roundTable
    ? "contributing to the discussion…"
    : (THINKING_STATUS[employee] ?? "thinking…");

  return (
    <div
      className="flex gap-3"
      style={{
        ["--dept" as string]: deptColor,
        opacity: isActive ? 1 : 0.45,
        transition: "opacity 200ms ease",
      }}
    >
      <div className="pt-1 shrink-0">
        <SpecialistAvatar employee={employee} size={32} streaming={isActive && !reduced} />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <SpecialistChip employee={employee} />
        <div
          role="status"
          aria-live="polite"
          aria-label={isActive ? `${name} is responding` : `${name} is waiting`}
          className="thinking-bubble inline-flex flex-col gap-2 px-4 py-3"
        >
          {reduced ? (
            /* prefers-reduced-motion: static label, no animation */
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
                      background: "var(--dept, var(--cx-accent))",
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
              {/* Micro-copy: animates when routing target is revealed */}
              <motion.span
                key={statusText}
                className="thinking-status"
                aria-hidden="true"
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                {statusText}
              </motion.span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
