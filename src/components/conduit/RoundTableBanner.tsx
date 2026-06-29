"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DEPT_COLOR, employeeLabel } from "./EmployeeBadge";
import { SpecialistAvatar } from "./SpecialistAvatar";
import { ROUND_TABLE_THINKING_STATUS } from "./TypingIndicator";
import type { EmployeeKey } from "@/lib/ai/provider";

/**
 * RoundTableBanner — replaces the plain "Team round-table" divider with a rich
 * glassmorphism panel showing each specialist's live state: queued → thinking → done.
 *
 * Spec refs: CONSOLE_REDESIGN.md — "Multi-specialist round-tables show who's active",
 * "AI is thinking / processing", "Glassmorphism (system-wide surface treatment)"
 */
export function RoundTableBanner({
  participants,
  activeEmployee,
  doneSet,
}: {
  /** Ordered list of specialists who have joined the round-table. */
  participants: EmployeeKey[];
  /** The specialist currently generating (thinking or streaming). null = none yet / between turns. */
  activeEmployee: EmployeeKey | null;
  /** Set of specialists who have completed their response. */
  doneSet: Set<EmployeeKey>;
}) {
  const reduced = useReducedMotion();
  const allDone = participants.length > 0 && participants.every((e) => doneSet.has(e));

  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-label={
        allDone
          ? "Round-table complete"
          : activeEmployee
          ? `${employeeLabel(activeEmployee)} is ${ROUND_TABLE_THINKING_STATUS[activeEmployee] ?? "contributing"}`
          : "Team round-table in progress"
      }
      className="cx-glass cx-glass-border my-4 p-3"
      style={{ borderRadius: 12 }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 mb-3">
        {!reduced ? (
          <motion.span
            aria-hidden
            className="shrink-0 rounded-full"
            style={{
              width: 8,
              height: 8,
              background: allDone ? "var(--cx-reward, #34D399)" : "var(--cx-accent, #7C6CFF)",
            }}
            animate={
              allDone
                ? { opacity: 1 }
                : { opacity: [0.45, 1, 0.45], scale: [0.8, 1.2, 0.8] }
            }
            transition={
              allDone
                ? {}
                : { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }
          />
        ) : (
          <span
            aria-hidden
            className="shrink-0 rounded-full"
            style={{
              width: 8,
              height: 8,
              background: allDone ? "var(--cx-reward, #34D399)" : "var(--cx-accent, #7C6CFF)",
            }}
          />
        )}
        <span
          className="cx-type-xs uppercase tracking-[0.18em] font-medium"
          style={{ color: allDone ? "var(--cx-reward, #34D399)" : "var(--color-text-muted, #A0A0B0)" }}
        >
          {allDone ? "Round-table complete" : "Team round-table"}
        </span>
      </div>

      {/* Participant chips — appear as each specialist joins */}
      {participants.length > 0 && (
        <AnimatePresence initial={false}>
          <div className="flex flex-wrap gap-2" aria-hidden>
            {participants.map((emp) => {
              const isDone = doneSet.has(emp);
              const isActive = activeEmployee === emp && !isDone;
              const isQueued = !isDone && !isActive;

              return (
                <motion.div
                  key={emp}
                  className="flex items-center gap-1.5 rounded-full transition-colors duration-200"
                  style={{
                    padding: "6px 10px",
                    background: isActive
                      ? "var(--cx-glass-bg-accent, rgba(124, 108, 255, 0.08))"
                      : isDone
                      ? "rgba(52, 211, 153, 0.08)"
                      : "var(--color-surface-elevated, #1C1C26)",
                    border: `1px solid ${
                      isActive
                        ? "rgba(124, 108, 255, 0.28)"
                        : isDone
                        ? "rgba(52, 211, 153, 0.22)"
                        : "var(--color-border, #262630)"
                    }`,
                    opacity: isQueued ? 0.48 : 1,
                  }}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: isQueued ? 0.48 : 1, scale: 1 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                >
                  <SpecialistAvatar
                    employee={emp}
                    size={14}
                    streaming={isActive && !reduced}
                  />
                  <span
                    className="cx-mono cx-type-xs font-medium"
                    style={{
                      color: isActive
                        ? "var(--cx-accent-bright, #9B8CFF)"
                        : isDone
                        ? "var(--cx-reward, #34D399)"
                        : "var(--color-text-muted, #A0A0B0)",
                    }}
                  >
                    {employeeLabel(emp)}
                  </span>
                  {isDone && (
                    <Check
                      size={10}
                      strokeWidth={2.5}
                      style={{ color: "var(--cx-reward, #34D399)", flexShrink: 0 }}
                      aria-hidden
                    />
                  )}
                  {isActive && !isDone && !reduced && (
                    <motion.span
                      aria-hidden
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 9999,
                        background: "var(--cx-accent, #7C6CFF)",
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}

      {/* Active specialist micro-copy — updates as each specialist becomes active */}
      <AnimatePresence mode="wait">
        {activeEmployee && !allDone && (
          <motion.p
            key={activeEmployee}
            className="cx-mono cx-type-xs mt-2.5"
            style={{ color: "var(--color-text-muted, #A0A0B0)" }}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <span
              style={{ color: DEPT_COLOR[activeEmployee], fontWeight: 500 }}
            >
              {employeeLabel(activeEmployee)}
            </span>{" "}
            {ROUND_TABLE_THINKING_STATUS[activeEmployee] ?? "is contributing…"}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
