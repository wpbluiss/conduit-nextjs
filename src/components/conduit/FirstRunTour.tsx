"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "@phosphor-icons/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const STORAGE_KEY = "praxis_tour_v1_done";

type Step = {
  title: string;
  body: string;
  /** Where to anchor the card: quadrant of the screen */
  anchor: "center" | "bottom" | "left" | "bottom-left";
};

const STEPS: Step[] = [
  {
    title: "Welcome to Praxis",
    body: "Your AI workforce is live and ready. Atlas is your Chief of Staff — ask anything and it will route to the right specialist.",
    anchor: "center",
  },
  {
    title: "Start a conversation",
    body: "Type or speak to your team. Atlas handles strategy; specialists like Engineering, Sales, and Marketing execute autonomously.",
    anchor: "bottom",
  },
  {
    title: "Your team of 9",
    body: "Every specialist is here in the sidebar. Click one to go straight to them, or let Atlas decide who picks up the task.",
    anchor: "left",
  },
  {
    title: "Settings & billing",
    body: "Your workspace, preferences, and plan live in Settings. Upgrade any time — your team gets more specialists and token budget.",
    anchor: "bottom-left",
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
        top: "50%",
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

export function FirstRunTour() {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only read localStorage on the client
    if (typeof window === "undefined") return;
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setVisible(true);
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }, []);

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

      {/* Coachmark card */}
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
              border: "1px solid rgba(91,99,232,0.3)",
              boxShadow:
                "0 0 0 1px rgba(91,99,232,0.12), 0 16px 48px rgba(10,9,8,0.4)",
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
                <span className="text-[11px] uppercase tracking-wider text-[var(--color-cream-mute)]">
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

            <h3 className="text-[15px] font-semibold text-[var(--color-cream)] leading-snug mb-2">
              {current.title}
            </h3>
            <p className="text-[13px] text-[var(--color-cream-soft)] leading-[1.6] mb-5">
              {current.body}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={dismiss}
                className="text-[12px] text-[var(--color-cream-mute)] hover:text-[var(--color-cream)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-indigo-500)] rounded"
              >
                Skip tour
              </button>
              <button
                type="button"
                onClick={next}
                className="conduit-btn-primary text-[13px] px-4 py-2 gap-1.5"
                autoFocus
              >
                {isLast ? "Get started" : "Next"}
                <ArrowRight size={13} weight="bold" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
