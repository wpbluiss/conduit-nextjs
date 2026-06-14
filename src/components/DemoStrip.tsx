"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, ArrowCounterClockwise } from "@phosphor-icons/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const EASE = [0.25, 1, 0.5, 1] as const;

type Message = {
  id: string;
  role: "user" | "specialist";
  specialist?: { name: string; color: string };
  text: string;
  delay: number; // ms after previous message is fully shown
};

// Scripted exchange — no API calls, pure client-side animation.
const SCRIPT: Message[] = [
  {
    id: "u1",
    role: "user",
    text: "Build me a user analytics dashboard component.",
    delay: 400,
  },
  {
    id: "s1",
    role: "specialist",
    specialist: { name: "Atlas · Chief of Staff", color: "#C8C5BD" },
    text: "On it. Routing to Engineering — this is a build, not a plan.",
    delay: 700,
  },
  {
    id: "s2",
    role: "specialist",
    specialist: { name: "Engineering · Praxis", color: "#60A5FA" },
    text: "Opening sandbox. Scaffolding the component now…",
    delay: 800,
  },
  {
    id: "s3",
    role: "specialist",
    specialist: { name: "Engineering · Praxis", color: "#60A5FA" },
    text: "Done. AnalyticsDashboard.tsx written, tests passing, PR opened. Deploy in ~3 minutes.",
    delay: 1000,
  },
];

const CHAR_DELAY = 22; // ms per character for typewriter effect
const LOOP_RESTART_DELAY = 3500; // ms before looping

export default function DemoStrip() {
  const reduced = useReducedMotion();
  const [started, setStarted] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const charTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (charTimerRef.current) clearTimeout(charTimerRef.current);
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    setVisibleCount(0);
    setTypedChars(0);
    setDone(false);
    setStarted(false);
  }, [clearTimers]);

  const replay = useCallback(() => {
    reset();
    // small delay so the reset renders before starting again
    setTimeout(() => setStarted(true), 80);
  }, [reset]);

  useEffect(() => {
    if (!started) return;

    // If reduced motion, show all messages instantly
    if (reduced) {
      setVisibleCount(SCRIPT.length);
      setTypedChars(SCRIPT[SCRIPT.length - 1].text.length);
      setDone(true);
      return;
    }

    if (visibleCount >= SCRIPT.length) {
      setDone(true);
      return;
    }

    const current = SCRIPT[visibleCount];

    // Wait the inter-message delay, then start typing
    timerRef.current = setTimeout(() => {
      setTypedChars(0);

      let charIdx = 0;
      const typeNext = () => {
        charIdx++;
        setTypedChars(charIdx);
        if (charIdx < current.text.length) {
          charTimerRef.current = setTimeout(typeNext, CHAR_DELAY);
        } else {
          // Message complete — advance to next
          timerRef.current = setTimeout(() => {
            setVisibleCount((c) => c + 1);
          }, 200);
        }
      };

      charTimerRef.current = setTimeout(typeNext, CHAR_DELAY);
    }, current.delay);

    return clearTimers;
  }, [started, visibleCount, reduced, clearTimers]);

  // Auto-loop
  useEffect(() => {
    if (!done || reduced) return;
    timerRef.current = setTimeout(replay, LOOP_RESTART_DELAY);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [done, reduced, replay]);

  // Pause when tab hidden to save CPU
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        clearTimers();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [clearTimers]);

  return (
    <section
      id="demo"
      className="relative conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)] overflow-hidden"
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(91,99,232,0.08) 0%, transparent 60%)",
        }}
      />

      <div className="relative conduit-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: reduced ? 0 : 0.7, ease: EASE }}
          className="text-center mb-12 md:mb-16"
        >
          <p className="conduit-caption conduit-caption-indigo">
            Try it now · No signup
          </p>
          <h2 className="conduit-display-xl mt-4">
            See a specialist{" "}
            <span className="conduit-ember-text">build something.</span>
          </h2>
          <p className="conduit-body-lg mt-4 max-w-[520px] mx-auto">
            This is a scripted demo — no API calls, no account needed. The real
            Console works the same way.
          </p>
        </motion.div>

        {/* Demo window */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: reduced ? 0 : 0.8, ease: EASE, delay: reduced ? 0 : 0.1 }}
          className="max-w-[720px] mx-auto"
        >
          <div
            className="rounded-2xl overflow-hidden border border-[var(--color-edge)]"
            style={{
              background: "var(--color-ink-surface)",
              boxShadow:
                "0 0 40px rgba(91,99,232,0.12), 0 16px 48px rgba(15,17,21,0.18)",
            }}
          >
            {/* Window chrome */}
            <div
              className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-edge-subtle)]"
              style={{ background: "var(--color-ink-surface-elevated)" }}
            >
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF6058]/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#28C940]/60" />
              </div>
              <span
                className="text-[11px] text-[var(--color-cream-mute)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                conduitai.io/app · Scripted demo
              </span>
              <span className="ml-auto text-[10px] uppercase tracking-wider text-[var(--color-conduit-success)] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-conduit-success)] shadow-[0_0_6px_currentColor]" />
                Live
              </span>
            </div>

            {/* Chat area */}
            <div
              className="min-h-[280px] px-5 py-5 space-y-4"
              style={{ background: "var(--color-ink-canvas)" }}
              aria-live="polite"
              aria-label="Demo chat transcript"
            >
              {/* Not started state */}
              {!started && (
                <div className="flex items-center justify-center h-[200px]">
                  <button
                    type="button"
                    onClick={() => setStarted(true)}
                    className="conduit-btn-primary gap-2"
                    aria-label="Play demo"
                  >
                    <Play size={15} weight="fill" />
                    Watch Praxis build
                  </button>
                </div>
              )}

              {/* Messages */}
              <AnimatePresence initial={false}>
                {SCRIPT.slice(0, visibleCount).map((msg, idx) => {
                  const isLast = idx === visibleCount - 1 && !done;
                  const displayText =
                    isLast && !reduced
                      ? msg.text.slice(0, typedChars)
                      : msg.text;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: reduced ? 0 : 0.3, ease: EASE }}
                    >
                      {msg.role === "user" ? (
                        <div className="flex justify-end">
                          <div
                            className="max-w-[78%] px-3.5 py-2 text-[13px] text-[var(--color-cream)] leading-[1.6]"
                            style={{
                              background: "rgba(91, 99, 232, 0.12)",
                              border: "1px solid rgba(91, 99, 232, 0.28)",
                              borderRadius: "16px 16px 4px 16px",
                            }}
                          >
                            {displayText}
                            {isLast && !reduced && (
                              <span className="inline-block w-[2px] h-[13px] bg-[var(--color-indigo-300)] ml-0.5 align-middle animate-pulse" />
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1.5 max-w-[88%]">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{
                                background: msg.specialist?.color,
                                boxShadow: `0 0 5px ${msg.specialist?.color}`,
                              }}
                            />
                            <span className="text-[10px] uppercase tracking-wider text-[var(--color-cream-mute)]">
                              {msg.specialist?.name}
                            </span>
                          </div>
                          <div
                            className="text-[13px] text-[var(--color-cream)] px-3.5 py-2.5 leading-[1.6]"
                            style={{
                              background: "var(--color-ink-surface-elevated)",
                              borderLeft: `2px solid ${msg.specialist?.color}`,
                              borderRadius: "0 16px 16px 16px",
                            }}
                          >
                            {displayText}
                            {isLast && !reduced && (
                              <span className="inline-block w-[2px] h-[13px] bg-[var(--color-cream-mute)] ml-0.5 align-middle animate-pulse" />
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Replay button */}
              {done && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="flex justify-center pt-2"
                >
                  <button
                    type="button"
                    onClick={replay}
                    className="flex items-center gap-1.5 text-[12px] text-[var(--color-cream-mute)] hover:text-[var(--color-cream)] transition-colors"
                    aria-label="Replay demo"
                  >
                    <ArrowCounterClockwise size={13} />
                    Replay
                  </button>
                </motion.div>
              )}
            </div>

            {/* Fake input bar */}
            <div
              className="px-5 py-3 border-t border-[var(--color-edge-subtle)]"
              style={{ background: "var(--color-ink-surface)" }}
              aria-hidden
            >
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full border"
                style={{
                  borderColor: "var(--color-edge)",
                  background: "var(--color-ink-canvas)",
                }}
              >
                <span className="text-[12px] text-[var(--color-cream-mute)] flex-1">
                  Talk to your team…
                </span>
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "var(--color-indigo-500)" }}
                >
                  <ArrowRight size={12} weight="bold" color="#0A0908" />
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: reduced ? 0 : 0.6, ease: EASE, delay: reduced ? 0 : 0.3 }}
          className="text-center mt-10"
        >
          <Link href="/auth/sign-up" className="conduit-btn-primary">
            Try the real Console
            <ArrowRight size={16} weight="bold" />
          </Link>
          <p className="text-[13px] text-[var(--color-cream-mute)] mt-3">
            Free to start. No credit card.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
