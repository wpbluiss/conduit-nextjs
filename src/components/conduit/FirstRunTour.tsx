"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "@phosphor-icons/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Button } from "@/components/conduit/ui/Button";

const STORAGE_KEY = "praxis_tour_v1_done";

type Step = {
  title: string;
  body: string;
  /** Where to anchor the card relative to the highlighted UI element */
  anchor: "center" | "bottom" | "left" | "bottom-left";
  /** data-tour-target value to highlight (optional) */
  target?: string;
};

const STEPS: Step[] = [
  {
    title: "Chat with your team",
    body: "Type a message below to start. Atlas is your Chief of Staff — it routes tasks to the right specialist automatically.",
    anchor: "bottom",
    target: "chat-input",
  },
  {
    title: "Your 9 specialists",
    body: "Engineering, Sales, Marketing, Finance and more — click any specialist in the sidebar to go straight to them, or let Atlas decide.",
    anchor: "left",
    target: "specialists",
  },
  {
    title: "Memory",
    body: "Praxis remembers context across conversations. Add business facts, brand voice, and goals so your team always has the right context.",
    anchor: "left",
    target: "memory",
  },
  {
    title: "Connectors",
    body: "Connect Slack, Google Calendar, Notion and more in Settings → Integrations. Your specialists pull live context from the tools you already use.",
    anchor: "bottom-left",
    target: "settings",
  },
];

const EASE = [0.25, 1, 0.5, 1] as const;

function cardPosition(anchor: Step["anchor"]): React.CSSProperties {
  switch (anchor) {
    case "center":
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    case "bottom":
      return {
        bottom: "96px",
        left: "50%",
        transform: "translateX(-50%)",
      };
    case "left":
      return {
        top: "40%",
        left: "calc(var(--sidebar-width, 256px) + 24px)",
        transform: "translateY(-50%)",
      };
    case "bottom-left":
      return {
        bottom: "72px",
        left: "calc(var(--sidebar-width, 256px) + 24px)",
      };
  }
}

export function FirstRunTour({ isFirstRun }: { isFirstRun: boolean }) {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isFirstRun) return;
    if (typeof window === "undefined") return;
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setVisible(true);
  }, [isFirstRun]);

  const markDone = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1");
    // Best-effort DB mark — fire-and-forget; failure is non-blocking.
    fetch("/api/conduit/account/onboarded", { method: "PATCH" }).catch(() => {});
  }, []);

  const dismiss = useCallback(() => {
    markDone();
    setVisible(false);
  }, [markDone]);

  const next = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  }, [step, dismiss]);

  // Keyboard dismiss
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, dismiss]);

  // Highlight the current step's target element
  useEffect(() => {
    if (!visible) return;
    const target = STEPS[step]?.target;
    if (!target) return;
    const el = document.querySelector<HTMLElement>(`[data-tour-target="${target}"]`);
    if (!el) return;
    el.setAttribute("data-tour-active", "true");
    return () => { el.removeAttribute("data-tour-active"); };
  }, [visible, step]);

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Praxis guided tour"
      style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none" }}
    >
      {/* Backdrop */}
      <AnimatePresence>
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.3 }}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(10,9,8,0.55)",
            backdropFilter: "blur(2px)",
            pointerEvents: "auto",
          }}
          onClick={dismiss}
          aria-hidden="true"
        />
      </AnimatePresence>

      {/* Coach mark card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 10, scale: reduced ? 1 : 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: reduced ? 0 : 0, y: reduced ? 0 : -6, scale: reduced ? 1 : 0.98 }}
          transition={{ duration: reduced ? 0 : 0.3, ease: EASE }}
          style={{
            position: "absolute",
            width: "clamp(280px, 90vw, 360px)",
            pointerEvents: "auto",
            ...cardPosition(current.anchor),
          }}
        >
          <div
            className="conduit-card p-6"
            style={{
              background: "var(--color-ink-surface-elevated)",
              border: "1px solid rgba(124,108,255,0.30)",
              boxShadow:
                "0 0 0 1px rgba(124,108,255,0.12), 0 16px 48px rgba(0,0,0,0.40)",
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                {/* Step dots */}
                <div className="flex gap-1">
                  {STEPS.map((_, i) => (
                    <span
                      key={i}
                      className="block rounded-full transition-all duration-200"
                      style={{
                        width: i === step ? 16 : 6,
                        height: 6,
                        background:
                          i === step
                            ? "var(--color-indigo-500)"
                            : i < step
                            ? "var(--color-indigo-300)"
                            : "var(--color-edge)",
                      }}
                    />
                  ))}
                </div>
                <span className="cx-type-xs uppercase tracking-wider text-[var(--color-cream-mute)]">
                  {step + 1} / {STEPS.length}
                </span>
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="text-[var(--color-cream-mute)] hover:text-[var(--color-cream)] transition-colors p-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-indigo-500)]"
                aria-label="Skip tour"
              >
                <X size={16} />
              </button>
            </div>

            <h3 className="text-sm font-semibold text-[var(--color-cream)] leading-snug mb-2">
              {current.title}
            </h3>
            <p className="cx-type-sm text-[var(--color-cream-soft)] leading-[1.6] mb-5">
              {current.body}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={dismiss}
                className="text-xs text-[var(--color-cream-mute)] hover:text-[var(--color-cream)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-indigo-500)] rounded"
              >
                Skip tour
              </button>
              <Button
                onClick={next}
                size="sm"
                autoFocus
              >
                {isLast ? "Get started" : "Next →"}
                <ArrowRight size={13} weight="bold" />
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
