"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const EASE = [0.25, 1, 0.5, 1] as const;
const AUTO_ROTATE_MS = 5000;

type Specialist = {
  name: string;
  dept: "engineering" | "marketing" | "sales" | "finance" | "ops" | "legal" | "compliance" | "hr";
};

type Archetype = {
  id: string;
  label: string;
  title: string;
  description: string;
  specialists: Specialist[];
  outcome: string;
};

const DEPT_COLORS: Record<Specialist["dept"], { fg: string; bg: string }> = {
  engineering: {
    fg: "var(--color-dept-engineering)",
    bg: "var(--color-dept-engineering-soft)",
  },
  marketing: {
    fg: "var(--color-dept-marketing)",
    bg: "var(--color-dept-marketing-soft)",
  },
  sales: {
    fg: "var(--color-dept-sales)",
    bg: "var(--color-dept-sales-soft)",
  },
  finance: {
    fg: "var(--color-dept-finance)",
    bg: "var(--color-dept-finance-soft)",
  },
  ops: {
    fg: "var(--color-dept-ops)",
    bg: "var(--color-dept-ops-soft)",
  },
  legal: {
    fg: "var(--color-dept-legal)",
    bg: "var(--color-dept-legal-soft)",
  },
  compliance: {
    fg: "var(--color-dept-compliance)",
    bg: "var(--color-dept-compliance-soft)",
  },
  hr: {
    fg: "var(--color-dept-hr)",
    bg: "var(--color-dept-hr-soft)",
  },
};

const ARCHETYPES: Archetype[] = [
  {
    id: "saas",
    label: "SaaS founder",
    title: "Ship your backlog. Write the launch copy. While you sleep.",
    description:
      "Your Praxis Engineering specialist takes a one-line ticket, writes the code, runs the build, and opens the PR — while Marketing writes the launch post. You check Slack in the morning to merged code and a published announcement.",
    specialists: [
      { name: "Engineering", dept: "engineering" },
      { name: "Marketing", dept: "marketing" },
    ],
    outcome: "3 features shipped · 2 posts published · 0 hours of your time",
  },
  {
    id: "ecommerce",
    label: "E-commerce operator",
    title: "Run operations at scale without an ops team.",
    description:
      "Praxis Operations monitors fulfillment, flags exceptions, and coordinates with vendors — while Finance-Ops reconciles your accounts and closes the month-end on schedule. You spend your week on product, not spreadsheets.",
    specialists: [
      { name: "Operations", dept: "ops" },
      { name: "Finance-Ops", dept: "finance" },
    ],
    outcome: "Ops queue cleared · Month-end closed on time · Zero exceptions missed",
  },
  {
    id: "agency",
    label: "Agency owner",
    title: "Close more deals. Deliver more work. No more late nights.",
    description:
      "Praxis Sales drafts your proposal and follows up with prospects while Legal reviews the contract for risk. You show up to sign, not to write. Every client gets a senior team. You never miss a deadline.",
    specialists: [
      { name: "Sales", dept: "sales" },
      { name: "Legal", dept: "legal" },
    ],
    outcome: "2 proposals sent · Contract reviewed in 4 min · 100% on-time delivery",
  },
];

function SpecialistTag({ name, dept }: Specialist) {
  const { fg, bg } = DEPT_COLORS[dept];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium"
      style={{ color: fg, background: bg }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: fg }}
        aria-hidden
      />
      {name}
    </span>
  );
}

export default function FounderScenarios() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback(() => {
    setActive((prev) => (prev + 1) % ARCHETYPES.length);
  }, []);

  useEffect(() => {
    if (reduced || paused) return;
    intervalRef.current = setInterval(advance, AUTO_ROTATE_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [advance, reduced, paused]);

  const select = (idx: number) => {
    setActive(idx);
    // Reset timer on manual selection
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!reduced && !paused) {
      intervalRef.current = setInterval(advance, AUTO_ROTATE_MS);
    }
  };

  const archetype = ARCHETYPES[active];

  return (
    <section
      id="founder-scenarios"
      className="relative conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Ambient radial */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 80% 60%, rgba(91,99,232,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="relative conduit-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: reduced ? 0 : 0.7, ease: EASE }}
          className="mb-12"
        >
          <p className="conduit-caption conduit-caption-ember">
            How founders use Praxis
          </p>
          <h2 className="conduit-display-xl mt-4 max-w-2xl">
            One platform. Every role.{" "}
            <span className="conduit-ember-text">Zero payroll.</span>
          </h2>
        </motion.div>

        {/* Tab selectors */}
        <motion.div
          initial={{ opacity: reduced ? 1 : 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: reduced ? 0 : 0.5, ease: EASE, delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-8"
          role="tablist"
          aria-label="Founder archetypes"
        >
          {ARCHETYPES.map((a, idx) => (
            <motion.button
              key={a.id}
              role="tab"
              aria-selected={active === idx}
              aria-controls={`scenario-panel-${a.id}`}
              onClick={() => select(idx)}
              whileHover={
                reduced || active === idx
                  ? {}
                  : { scale: 1.04, backgroundColor: "rgba(255,255,255,0.12)" }
              }
              whileTap={reduced ? {} : { scale: 0.96 }}
              transition={{ duration: 0.15, ease: EASE }}
              className="relative overflow-hidden px-4 py-2 rounded-full text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-indigo-500)]"
              style={{
                background:
                  active === idx
                    ? "var(--color-indigo-500)"
                    : "rgba(255,255,255,0.06)",
                color:
                  active === idx
                    ? "#fff"
                    : "var(--color-cream-mute, #a99fc7)",
              }}
            >
              {a.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Progress dots */}
        {!reduced && (
          <div className="flex gap-1.5 mb-8" aria-hidden>
            {ARCHETYPES.map((_, idx) => (
              <div
                key={idx}
                className="h-0.5 rounded-full transition-all duration-300"
                style={{
                  width: active === idx ? "24px" : "8px",
                  background:
                    active === idx
                      ? "var(--color-indigo-500)"
                      : "var(--color-edge-subtle, rgba(255,255,255,0.12))",
                }}
              />
            ))}
          </div>
        )}

        {/* Scenario card */}
        <div
          className="relative"
          style={{ minHeight: "280px" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={archetype.id}
              id={`scenario-panel-${archetype.id}`}
              role="tabpanel"
              initial={{ opacity: reduced ? 1 : 0, x: reduced ? 0 : 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: reduced ? 1 : 0, x: reduced ? 0 : -24 }}
              transition={{ duration: reduced ? 0 : 0.45, ease: EASE }}
              className="conduit-card p-8 md:p-10 grid md:grid-cols-[minmax(0,1fr)_minmax(0,320px)] gap-8 md:gap-12 items-start"
            >
              {/* Left — content */}
              <div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {archetype.specialists.map((s) => (
                    <SpecialistTag key={s.name} {...s} />
                  ))}
                </div>
                <h3
                  className="text-[22px] md:text-[26px] leading-[1.25] font-medium tracking-[-0.02em]"
                  style={{ color: "var(--color-cream, #f5f1ea)" }}
                >
                  {archetype.title}
                </h3>
                <p
                  className="mt-4 conduit-body-md leading-relaxed"
                  style={{ color: "var(--color-cream-mute, #a99fc7)" }}
                >
                  {archetype.description}
                </p>
              </div>

              {/* Right — outcome */}
              <div
                className="rounded-xl p-6 border"
                style={{
                  background: "rgba(91,99,232,0.06)",
                  borderColor: "rgba(91,99,232,0.18)",
                }}
              >
                <p
                  className="text-[11px] uppercase tracking-[0.1em] font-medium mb-3"
                  style={{ color: "var(--color-indigo-300, #a8affb)" }}
                >
                  What happened overnight
                </p>
                <p
                  className="text-[14px] leading-relaxed font-medium"
                  style={{ color: "var(--color-cream, #f5f1ea)" }}
                >
                  {archetype.outcome}
                </p>

                {/* Auto-rotate progress bar */}
                {!reduced && !paused && (
                  <div
                    className="mt-5 h-px rounded-full overflow-hidden"
                    style={{ background: "rgba(91,99,232,0.15)" }}
                    aria-hidden
                  >
                    <motion.div
                      key={`${archetype.id}-progress`}
                      className="h-full rounded-full"
                      style={{ background: "var(--color-indigo-500)" }}
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: AUTO_ROTATE_MS / 1000, ease: "linear" }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
