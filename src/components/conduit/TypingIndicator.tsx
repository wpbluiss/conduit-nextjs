"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DEPT_COLOR, employeeLabel, SpecialistChip } from "./EmployeeBadge";
import { SpecialistAvatar } from "./SpecialistAvatar";
import type { EmployeeKey } from "@/lib/ai/provider";

// Contextual mono micro-copy per specialist — shown while waiting for first token.
// Exported so Chat.tsx and other consumers can share the same copy without duplication.
export const THINKING_STATUS: Record<EmployeeKey, string> = {
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

// Per-dot framer-motion variants — stagger is applied via delay in transition.
// Uses accent color (#7C6CFF) per spec: thinking animation is accent, not dept color.
const dotVariants = {
  pulse: (i: number) => ({
    scale: [0.75, 1, 1, 0.75],
    opacity: [0.15, 1, 1, 0.15],
    transition: {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      repeat: Infinity,
      delay: i * 0.16,
    },
  }),
};

// Routing micro-copy shown when Atlas has determined which specialist to route to.
// Exported for use in Chat.tsx presence line.
export const ROUTING_TO_STATUS: Partial<Record<EmployeeKey, string>> = {
  marketing:   "routing to Marketing…",
  engineering: "routing to Engineering…",
  sales:       "routing to Sales…",
  finance:     "routing to Finance…",
  compliance:  "routing to Compliance…",
  hr:          "routing to HR…",
  ops:         "routing to Operations…",
  legal:       "routing to Legal…",
};

/**
 * The chip + animated thinking bubble without any outer flex wrapper or avatar.
 * Used by Chat.tsx's MessageBubble so the avatar lives in the stable outer
 * shell and only the content area crossfades when streaming begins.
 *
 * Staged indicator (spec §"AI is thinking"):
 *   1. Glass bubble surface appears immediately with the message slot entry.
 *   2. After 120ms the animated dots + mono micro-copy fade in (acknowledge → thinking).
 *   3. When first token arrives, Chat.tsx's AnimatePresence exits this and enters content.
 */
export function ThinkingBubble({
  employee,
  roundTable = false,
  isActive = true,
  routingTarget = null,
}: {
  employee: EmployeeKey;
  roundTable?: boolean;
  isActive?: boolean;
  routingTarget?: EmployeeKey | null;
}) {
  const reduced = useReducedMotion();
  const name = employeeLabel(employee);

  // Stage 2 gate: glass surface mounts immediately; animated content follows after
  // a brief settle so the message slot "acknowledges" before the thinking animation
  // starts. If the first streaming token arrives before this fires, the component
  // unmounts — user never sees a spurious flash of dots.
  const [showDots, setShowDots] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setShowDots(true), 120);
    return () => clearTimeout(id);
  }, []);

  const statusText = !isActive
    ? "waiting…"
    : routingTarget && employee === "jarvis"
    ? (ROUTING_TO_STATUS[routingTarget] ?? `routing to ${employeeLabel(routingTarget)}…`)
    : roundTable
    ? "contributing to the discussion…"
    : (THINKING_STATUS[employee] ?? "thinking…");

  return (
    <div
      className="space-y-1.5"
      style={{ opacity: isActive ? 1 : 0.45, transition: "opacity 200ms ease" }}
    >
      <SpecialistChip employee={employee} />
      <div
        role="status"
        aria-live="polite"
        aria-label={isActive ? `${name} is responding` : `${name} is waiting`}
        className="thinking-bubble inline-flex flex-col gap-2 px-4 py-3"
        style={{ minHeight: 44 }}
      >
        {reduced ? (
          /* Reduced motion: skip staged delay, render text immediately */
          showDots && <span className="thinking-status">{statusText}</span>
        ) : (
          <AnimatePresence>
            {showDots && (
              <motion.div
                key="thinking-content"
                className="flex flex-col gap-2"
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
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
                        width: 6,
                        height: 6,
                        borderRadius: 9999,
                        background: "var(--cx-accent)",
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </div>
                {/* Mono micro-copy — re-animates when routing target is revealed */}
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
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

/** Standalone indicator with avatar — used outside of MessageBubble (e.g. tests, storybook). */
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
  const deptColor = DEPT_COLOR[employee];

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
      <div className="min-w-0 flex-1">
        <ThinkingBubble
          employee={employee}
          roundTable={roundTable}
          isActive={isActive}
          routingTarget={routingTarget}
        />
      </div>
    </div>
  );
}
