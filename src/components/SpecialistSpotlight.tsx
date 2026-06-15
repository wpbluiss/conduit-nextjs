"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Code2,
  DollarSign,
  HeartHandshake,
  Megaphone,
  Scale,
  TrendingUp,
} from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const EASE = [0.25, 1, 0.5, 1] as const;
const INTERVAL_MS = 5000;

type Card = {
  dept: string;
  color: string;
  colorSoft: string;
  icon: React.ElementType;
  role: string;
  quote: string;
  metric: string;
  founder: string;
  company: string;
};

const CARDS: Card[] = [
  {
    dept: "Marketing",
    color: "var(--color-dept-marketing)",
    colorSoft: "var(--color-dept-marketing-soft)",
    icon: Megaphone,
    role: "Your brand voice, automated",
    quote:
      "I had our launch email sequence written, designed-ready, and scheduled in under an hour. No brief loop, no agency.",
    metric: "Saved 6 hours",
    founder: "Priya S.",
    company: "E-commerce brand",
  },
  {
    dept: "Sales",
    color: "var(--color-dept-sales)",
    colorSoft: "var(--color-dept-sales-soft)",
    icon: TrendingUp,
    role: "Pipeline that builds itself",
    quote:
      "Our sales specialist qualified 200 leads and drafted every follow-up sequence. Our pipeline tripled in 30 days.",
    metric: "3× pipeline",
    founder: "Daniel K.",
    company: "Series A startup",
  },
  {
    dept: "Engineering",
    color: "var(--color-dept-engineering)",
    colorSoft: "var(--color-dept-engineering-soft)",
    icon: Code2,
    role: "Code shipped, not described",
    quote:
      "Engineering shipped a feature that would have cost $8k in contractor hours — over a single weekend.",
    metric: "Saved $8k",
    founder: "Alex R.",
    company: "Dev-tools SaaS",
  },
  {
    dept: "Finance",
    color: "var(--color-dept-finance)",
    colorSoft: "var(--color-dept-finance-soft)",
    icon: DollarSign,
    role: "Numbers that explain themselves",
    quote:
      "Finance modeled our Q4 cash flow and flagged a payroll gap 6 weeks before it would have blindsided us.",
    metric: "6 weeks early",
    founder: "Yuki M.",
    company: "Fintech scale-up",
  },
  {
    dept: "Legal",
    color: "var(--color-dept-legal)",
    colorSoft: "var(--color-dept-legal-soft)",
    icon: Scale,
    role: "Contracts without the retainer",
    quote:
      "I had legal review our SaaS ToS in 4 minutes. That would have been a $1,200 invoice from our law firm.",
    metric: "Saved 3 hours",
    founder: "Marcus B.",
    company: "B2B SaaS",
  },
  {
    dept: "HR",
    color: "var(--color-dept-hr)",
    colorSoft: "var(--color-dept-hr-soft)",
    icon: HeartHandshake,
    role: "People ops on autopilot",
    quote:
      "HR wrote our entire onboarding handbook and offer letters in one afternoon. Our first hire thought we had a real HR team.",
    metric: "Saved 2 days",
    founder: "Sarah L.",
    company: "Ops-heavy startup",
  },
];

export default function SpecialistSpotlight() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = CARDS.length;

  const advance = useCallback(
    (dir: 1 | -1) => {
      setDirection(dir);
      setActive((prev) => (prev + dir + total) % total);
    },
    [total],
  );

  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(() => advance(1), INTERVAL_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, paused, advance]);

  const card = CARDS[active];
  const Icon = card.icon;

  const variants = {
    enter: (dir: number) => ({
      x: reduced ? 0 : dir > 0 ? "100%" : "-100%",
      opacity: reduced ? 1 : 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: reduced ? 0 : dir > 0 ? "-55%" : "55%",
      opacity: 0,
    }),
  };

  return (
    <section
      id="specialist-spotlight"
      className="relative conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)] overflow-hidden"
    >
      {/* Dept-tinted ambient glow — shifts hue as the active card changes */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% 0%, color-mix(in srgb, ${card.color} 7%, transparent) 0%, transparent 65%)`,
          transition: "background 700ms ease",
        }}
      />

      <div className="relative conduit-container">
        {/* Section header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <p className="conduit-caption conduit-caption-ember mb-4">
            Specialist spotlight
          </p>
          <h2 className="conduit-display-xl">
            Real problems.{" "}
            <span className="conduit-ember-text">Real results.</span>
          </h2>
          <p className="conduit-body-md mt-4 max-w-[480px] mx-auto text-[var(--color-cream-mute)]">
            See exactly how each specialist moves the needle for founders like
            you.
          </p>
        </motion.div>

        {/* Carousel */}
        <div
          className="relative max-w-3xl mx-auto"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Fixed-height track prevents layout shift as cards swap */}
          <div className="relative overflow-hidden min-h-[340px] sm:min-h-[260px]">
            <AnimatePresence custom={direction}>
              <motion.div
                key={active}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { duration: 0.42, ease: EASE },
                  opacity: { duration: 0.32 },
                }}
                className="absolute inset-0"
              >
                <div
                  className="conduit-card h-full p-7 md:p-9 flex flex-col sm:flex-row gap-6 sm:gap-8"
                  style={{
                    borderColor: `color-mix(in srgb, ${card.color} 22%, var(--color-edge-subtle))`,
                  }}
                >
                  {/* Left column: badge + metric */}
                  <div className="flex sm:flex-col items-center sm:items-start gap-4 sm:gap-5 shrink-0 sm:w-40">
                    {/* Specialist icon avatar */}
                    <span
                      className="inline-flex items-center justify-center w-14 h-14 rounded-2xl shrink-0"
                      style={{
                        background: card.colorSoft,
                        color: card.color,
                        boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, ${card.color} 35%, transparent)`,
                      }}
                    >
                      <Icon size={26} strokeWidth={2} />
                    </span>

                    <div className="min-w-0">
                      <span
                        className="block text-sm font-semibold"
                        style={{ color: card.color }}
                      >
                        {card.dept}
                      </span>
                      <span className="block text-[12px] text-[var(--color-cream-mute)] mt-0.5 leading-tight">
                        {card.role}
                      </span>
                    </div>

                    {/* Outcome metric chip */}
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap shrink-0"
                      style={{
                        background: card.colorSoft,
                        color: card.color,
                        border: `1px solid color-mix(in srgb, ${card.color} 28%, transparent)`,
                      }}
                    >
                      {card.metric}
                    </span>
                  </div>

                  {/* Right column: quote + attribution */}
                  <div className="flex flex-col justify-between gap-5 flex-1 min-w-0">
                    <div>
                      {/* Decorative opening quote mark */}
                      <svg
                        width="28"
                        height="21"
                        viewBox="0 0 32 24"
                        fill="none"
                        aria-hidden
                        className="mb-3"
                      >
                        <path
                          d="M0 24V14.4C0 6.4 4.267 1.6 12.8 0l1.6 2.4C9.6 3.6 7.2 6.133 7.2 10v.8H14V24H0Zm18 0V14.4C18 6.4 22.267 1.6 30.8 0l1.2 2.4C27.2 3.6 24.8 6.133 24.8 10v.8H32V24H18Z"
                          fill="currentColor"
                          style={{ color: card.color, opacity: 0.35 }}
                        />
                      </svg>
                      <p
                        className="conduit-body-md leading-relaxed"
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        &ldquo;{card.quote}&rdquo;
                      </p>
                    </div>

                    {/* Founder attribution */}
                    <div className="flex items-center gap-3 border-t border-[var(--color-edge-subtle)] pt-5">
                      <span
                        className="inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold shrink-0"
                        style={{
                          background: `color-mix(in srgb, ${card.color} 15%, var(--color-surface-elevated))`,
                          color: card.color,
                          boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${card.color} 25%, transparent)`,
                        }}
                      >
                        {card.founder[0]}
                      </span>
                      <div>
                        <span className="block text-[13px] font-medium text-[var(--color-cream)]">
                          {card.founder}
                        </span>
                        <span className="block text-[12px] text-[var(--color-cream-mute)] mt-0.5">
                          Founder · {card.company}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Prev arrow */}
          <button
            type="button"
            onClick={() => advance(-1)}
            aria-label="Previous specialist"
            className="absolute -left-4 md:-left-8 top-1/2 -translate-y-1/2 p-2 rounded-full text-[var(--color-cream-mute)] hover:text-[var(--color-cream)] bg-[var(--color-surface-elevated)] border border-[var(--color-edge-subtle)] hover:border-[var(--color-accent)] transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Next arrow */}
          <button
            type="button"
            onClick={() => advance(1)}
            aria-label="Next specialist"
            className="absolute -right-4 md:-right-8 top-1/2 -translate-y-1/2 p-2 rounded-full text-[var(--color-cream-mute)] hover:text-[var(--color-cream)] bg-[var(--color-surface-elevated)] border border-[var(--color-edge-subtle)] hover:border-[var(--color-accent)] transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Dot / pill indicators */}
        <div
          className="flex items-center justify-center gap-2 mt-8"
          role="tablist"
          aria-label="Specialist spotlight indicators"
        >
          {CARDS.map((c, i) => (
            <button
              key={c.dept}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Show ${c.dept} spotlight`}
              onClick={() => {
                setDirection(i > active ? 1 : -1);
                setActive(i);
              }}
              className="rounded-full transition-all duration-300"
              style={
                i === active
                  ? { width: 24, height: 8, background: card.color }
                  : {
                      width: 8,
                      height: 8,
                      background: "var(--color-edge-subtle)",
                    }
              }
            />
          ))}
        </div>

        <p className="text-center text-[12px] text-[var(--color-cream-mute)] mt-8 opacity-60">
          Illustrative outcomes — real use cases coming soon.
        </p>
      </div>
    </section>
  );
}
