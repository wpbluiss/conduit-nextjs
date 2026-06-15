"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const EASE = [0.25, 1, 0.5, 1] as const;

const CAPTIONS = [
  "→ marketing room: campaign drafted live",
  "→ engineering bay: build deploying",
  "→ boardroom: roundtable in session",
];

export default function Cinematic() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative conduit-bg-canvas overflow-hidden border-y border-[var(--color-edge-subtle)]">
      {/* Top gradient line */}
      <motion.div
        initial={{ scaleX: shouldReduceMotion ? 1 : 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: shouldReduceMotion ? 0 : 1.6, ease: EASE }}
        className="origin-left absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(91, 99, 232,0.6), transparent)",
        }}
        aria-hidden
      />

      <div className="relative conduit-container py-24 md:py-32">
        {/* Header */}
        <motion.div
          initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.8, ease: EASE }}
          className="text-center max-w-[820px] mx-auto mb-12 md:mb-16"
        >
          <p className="conduit-caption conduit-caption-ember">
            Praxis Console · Live now
          </p>
          <h2 className="conduit-display-2xl mt-6">
            Walk into a company you don&rsquo;t have to staff.
          </h2>
          <p className="conduit-body-lg mt-6 max-w-[600px] mx-auto">
            A spatial workspace where each employee has a desk, an avatar, a
            voice. Step into a room and the work is already happening.
          </p>
        </motion.div>

        {/* Interactive demo panel */}
        <motion.div
          initial={{ opacity: shouldReduceMotion ? 1 : 0, scale: shouldReduceMotion ? 1 : 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: shouldReduceMotion ? 0 : 1.2, ease: EASE }}
          className="relative max-w-[1100px] mx-auto"
        >
          {/* Outer ember aura */}
          <div
            aria-hidden
            className="absolute -inset-16 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(91, 99, 232,0.18) 0%, transparent 65%)",
              filter: "blur(40px)",
            }}
          />

          {/* Frame — indigo-glow ring */}
          <div
            className="relative conduit-inverse aspect-[16/9] rounded-2xl overflow-hidden bg-[var(--color-ink-surface)]"
            style={{
              boxShadow:
                "inset 0 0 0 1px rgba(91, 99, 232, 0.28), 0 0 80px rgba(91, 99, 232, 0.18), 0 32px 80px rgba(15, 17, 21, 0.16)",
            }}
          >
            <CinematicDemo />

            {/* Corner accent overlay */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 50% 50% at 90% 10%, rgba(91, 99, 232, 0.10) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 10% 90%, rgba(91, 99, 232, 0.08) 0%, transparent 60%)",
              }}
            />
          </div>
        </motion.div>

        {/* Mono captions */}
        <motion.div
          initial={shouldReduceMotion ? "show" : "hidden"}
          whileInView="show"
          viewport={{ once: true, margin: "-10%" }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: shouldReduceMotion ? {} : { staggerChildren: 0.12, delayChildren: 0.4 },
            },
          }}
          className="mt-14 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 max-w-[1100px] mx-auto"
        >
          {CAPTIONS.map((c) => (
            <motion.div
              key={c}
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: shouldReduceMotion ? {} : { duration: 0.6, ease: EASE },
                },
              }}
              className="text-[13px] md:text-[14px] text-[var(--color-cream-soft)] tracking-[-0.005em] py-3 px-4 border-l border-[var(--color-edge)] bg-[var(--color-ink-surface)]/40"
              style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}
            >
              {c}
            </motion.div>
          ))}
        </motion.div>

        {/* Tertiary CTA */}
        <motion.div
          initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.8, ease: EASE, delay: shouldReduceMotion ? 0 : 0.8 }}
          className="text-center mt-12"
        >
          <Link
            href="/products/praxis-hq"
            className="inline-flex items-center gap-2 text-[14px] text-[var(--color-indigo-500)] hover:gap-3 transition-[gap]"
          >
            Reserve early access
            <ArrowRight size={14} weight="bold" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Live demo panel ──────────────────────────────────────────────────────── */

const SEGMENTS = [
  { label: "Warm leads", count: "84 contacts", action: "Follow-up sequence · 4 steps" },
  { label: "Cold outreach", count: "312 contacts", action: "LinkedIn + email · 6-day cadence" },
  { label: "Re-engagement", count: "47 contacts", action: "Win-back offer · 3-step sequence" },
];

const METRICS = ["Open rate target: 28%", "Reply rate: 4.2%", "Pipeline: $180k"];

function CinematicDemo() {
  const shouldReduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setStep(99);
      return;
    }

    setStep(0);
    const tt: ReturnType<typeof setTimeout>[] = [];

    tt.push(setTimeout(() => setStep(1), 500));   // user message
    tt.push(setTimeout(() => setStep(2), 1700));  // atlas reply
    tt.push(setTimeout(() => setStep(3), 2700));  // system handoff
    tt.push(setTimeout(() => setStep(4), 3700));  // marketing reply
    tt.push(setTimeout(() => setStep(5), 5200));  // result card
    tt.push(setTimeout(() => setStep(0), 13500)); // fade out before reset
    tt.push(setTimeout(() => setCycle((c) => c + 1), 15000)); // restart loop

    return () => tt.forEach(clearTimeout);
  }, [shouldReduceMotion, cycle]);

  const v = (n: number) => step >= n;

  return (
    <div className="absolute inset-0 flex flex-col md:flex-row overflow-hidden">
      {/* Ambient gradient */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 35% 50%, rgba(91, 99, 232, 0.15) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 80% 20%, rgba(214, 120, 23, 0.07) 0%, transparent 60%)",
          backgroundColor: "var(--color-ink-canvas)",
        }}
      />

      {/* LEFT: Chat log */}
      <div className="relative z-10 flex flex-col px-4 py-4 md:px-5 md:py-5 flex-1 md:border-r border-b md:border-b-0 border-[var(--color-edge-subtle)] h-1/2 md:h-full overflow-hidden">
        <p className="text-[9px] uppercase tracking-[0.09em] text-[var(--color-ink-tertiary)] mb-3.5 font-semibold flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full bg-[#28C940]"
            style={{ boxShadow: "0 0 5px #28C940" }}
          />
          Praxis Console · live session
        </p>

        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          <DemoLine show={v(1)}>
            <UserBubble>Draft our Q2 outreach campaign and flag the key metrics.</UserBubble>
          </DemoLine>

          <DemoLine show={v(2)}>
            <AgentBubble dot="#C8C5BD" label="Atlas · Chief of Staff" border="#C8C5BD">
              On it — routing to Marketing.
            </AgentBubble>
          </DemoLine>

          <DemoLine show={v(3)}>
            <Handoff dot="#FF8A3D">Marketing is taking this from here</Handoff>
          </DemoLine>

          <DemoLine show={v(4)}>
            <AgentBubble dot="#FF8A3D" label="Marketing" border="#FF8A3D">
              Campaign drafted. Three segments active — output on the right.
            </AgentBubble>
          </DemoLine>

          {/* Typing dots */}
          <motion.div
            animate={{ opacity: v(1) && !v(5) && !shouldReduceMotion ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-1.5 mt-1"
            aria-hidden
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[var(--color-ink-tertiary)] opacity-70"
                style={{
                  animation: "typingDot 1.2s ease-in-out infinite",
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </motion.div>
        </div>

        {/* Fake input bar */}
        <div
          className="mt-3 flex items-center gap-2 px-3.5 py-2 rounded-full border border-[var(--color-edge)]"
          style={{ background: "rgba(0,0,0,0.3)" }}
        >
          <span
            className="text-[11px] text-[var(--color-ink-tertiary)] flex-1"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Talk to your team…
          </span>
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "var(--color-indigo-500)" }}
          >
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
              <path
                d="M1.5 4.5h6M5.5 2.5l2 2-2 2"
                stroke="#0A0908"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>

      {/* RIGHT: Result card */}
      <div
        className="relative z-10 flex flex-col px-4 py-4 md:px-5 md:py-5 h-1/2 md:h-full md:w-[280px] lg:w-[320px] overflow-hidden"
        style={{ background: "rgba(91, 99, 232, 0.03)" }}
      >
        <p className="text-[9px] uppercase tracking-[0.09em] text-[var(--color-ink-tertiary)] mb-3.5 font-semibold">
          Campaign output
        </p>

        <motion.div
          animate={{ opacity: v(5) ? 1 : 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <p
            className="text-[13px] text-[var(--color-cream)] mb-3"
            style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
          >
            Q2 Outreach Campaign
          </p>

          <div className="space-y-2 mb-3">
            {SEGMENTS.map((seg, i) => (
              <motion.div
                key={`${seg.label}-${cycle}`}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: v(5) ? 1 : 0, x: v(5) ? 0 : 8 }}
                transition={{ duration: 0.35, delay: i * 0.15 }}
                className="px-3 py-2 rounded-lg"
                style={{
                  background: "rgba(91, 99, 232, 0.07)",
                  border: "1px solid rgba(91, 99, 232, 0.15)",
                }}
              >
                <div className="flex items-baseline justify-between mb-0.5">
                  <span className="text-[11px] text-[var(--color-cream)] font-medium">
                    {seg.label}
                  </span>
                  <span className="text-[10px] text-[var(--color-indigo-300)]">
                    {seg.count}
                  </span>
                </div>
                <p className="text-[10px] text-[var(--color-ink-tertiary)]">{seg.action}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-auto pt-3 border-t border-[var(--color-edge-subtle)]">
            <p className="text-[9px] uppercase tracking-[0.08em] text-[var(--color-ink-tertiary)] mb-2 font-semibold">
              Key metrics
            </p>
            <div className="space-y-1.5">
              {METRICS.map((m, i) => (
                <motion.p
                  key={`${m}-${cycle}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: v(5) ? 1 : 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + i * 0.12 }}
                  className="text-[10px] text-[var(--color-cream-soft)] flex items-center gap-1.5"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  <span style={{ color: "var(--color-ember-500)" }}>→</span>
                  {m}
                </motion.p>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Placeholder when result not yet generated */}
        <motion.div
          animate={{ opacity: v(5) ? 0 : 1 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <p
            className="text-[11px] text-[var(--color-ink-tertiary)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {v(4) ? "Generating output…" : "Awaiting task…"}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Demo sub-components ──────────────────────────────────────────────────── */

function DemoLine({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <motion.div
      animate={{ opacity: show ? 1 : 0, y: show ? 0 : 6 }}
      initial={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[82%] px-3.5 py-2 text-[11px] md:text-[12px] text-[var(--color-cream)] leading-[1.55]"
        style={{
          background: "rgba(91, 99, 232, 0.12)",
          border: "1px solid rgba(91, 99, 232, 0.25)",
          borderRadius: "14px 14px 3px 14px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function AgentBubble({
  dot,
  label,
  border,
  children,
}: {
  dot: string;
  label: string;
  border: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.07em] text-[var(--color-ink-tertiary)] mb-1 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dot }} />
        {label}
      </p>
      <div
        className="inline-block max-w-[85%] px-3.5 py-2 text-[11px] md:text-[12px] text-[var(--color-cream)] leading-[1.55]"
        style={{
          background: "var(--color-ink-surface-elevated)",
          borderLeft: `2px solid ${border}`,
          borderRadius: "0 14px 14px 14px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Handoff({ dot, children }: { dot: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)]">
      <span className="flex-1 h-px bg-[var(--color-edge-subtle)]" />
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dot }} />
      {children}
      <span className="flex-1 h-px bg-[var(--color-edge-subtle)]" />
    </div>
  );
}
