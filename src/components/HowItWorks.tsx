"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const EASE = [0.25, 1, 0.5, 1] as const;

const STEPS = [
  {
    number: "01",
    headline: "Tell Praxis your goal",
    body: "Type a prompt — Atlas reads it, picks the right specialist automatically, and hands off without you lifting a finger.",
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="10" width="40" height="28" rx="6" stroke="currentColor" strokeWidth="1.5" />
        <line x1="12" y1="20" x2="30" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="hiw-cursor-line" />
        <rect x="30" y="17" width="2" height="6" rx="1" fill="currentColor" className="hiw-cursor" />
      </svg>
    ),
    accentVar: "var(--color-dept-jarvis, var(--color-accent))",
  },
  {
    number: "02",
    headline: "Your AI team gets to work",
    body: "Marketing drafts copy. Engineering writes specs. Finance models the numbers. All in parallel, all in one chat.",
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden xmlns="http://www.w3.org/2000/svg">
        {/* Three overlapping activity bars */}
        <rect x="8" y="28" width="8" height="12" rx="2" fill="currentColor" opacity="0.5" className="hiw-bar-1" />
        <rect x="20" y="20" width="8" height="20" rx="2" fill="currentColor" opacity="0.7" className="hiw-bar-2" />
        <rect x="32" y="12" width="8" height="28" rx="2" fill="currentColor" className="hiw-bar-3" />
      </svg>
    ),
    accentVar: "var(--color-dept-marketing, var(--color-accent))",
  },
  {
    number: "03",
    headline: "Ship and iterate",
    body: "Artifacts land in your workspace. Review, refine with a follow-up, and ship — no re-briefing required.",
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="8" width="24" height="32" rx="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M28 8 L40 20" stroke="currentColor" strokeWidth="1.5" />
        <path d="M28 8 L28 20 L40 20" stroke="currentColor" strokeWidth="1.5" />
        <line x1="13" y1="20" x2="27" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="13" y1="26" x2="27" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="38" cy="36" r="6" fill="currentColor" className="hiw-check-circle" />
        <path d="M35 36 L37.5 38.5 L41 33.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    accentVar: "var(--color-dept-engineering, var(--color-accent))",
  },
] as const;

export default function HowItWorks() {
  const reduced = useReducedMotion();

  return (
    <section
      id="how-it-works"
      className="relative conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)] overflow-hidden"
    >
      {/* Subtle ambient gradient */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(91,99,232,0.05) 0%, transparent 55%)",
        }}
      />

      <style>{`
        @keyframes hiw-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes hiw-rise {
          0% { transform: scaleY(0.4); opacity: 0.4; }
          100% { transform: scaleY(1); opacity: 1; }
        }
        @keyframes hiw-pop {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        .hiw-cursor { animation: hiw-blink 1s step-end infinite; }
        .hiw-bar-1 { animation: hiw-rise 1.2s ease-out 0.2s both; transform-origin: bottom; }
        .hiw-bar-2 { animation: hiw-rise 1.2s ease-out 0.4s both; transform-origin: bottom; }
        .hiw-bar-3 { animation: hiw-rise 1.2s ease-out 0.6s both; transform-origin: bottom; }
        .hiw-check-circle { animation: hiw-pop 0.6s ease-out 0.8s both; }
        @media (prefers-reduced-motion: reduce) {
          .hiw-cursor, .hiw-bar-1, .hiw-bar-2, .hiw-bar-3, .hiw-check-circle {
            animation: none;
          }
        }
      `}</style>

      <div className="relative conduit-container">
        {/* Section header */}
        <motion.div
          initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: reduced ? 0 : 0.7, ease: EASE }}
          className="text-center mb-16"
        >
          <p className="conduit-caption conduit-caption-indigo">How it works</p>
          <h2 className="conduit-display-xl mt-4">
            From idea to shipped{" "}
            <span className="conduit-ember-text">in minutes</span>
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line — desktop only */}
          <div
            aria-hidden
            className="hidden md:block absolute top-[52px] left-[calc(16.66%+48px)] right-[calc(16.66%+48px)] h-px"
            style={{
              background:
                "linear-gradient(to right, transparent, var(--color-edge-subtle) 20%, var(--color-edge-subtle) 80%, transparent)",
            }}
          />

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-10%" }}
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: reduced ? 0 : 0.18 } },
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8"
          >
            {STEPS.map((step) => (
              <motion.div
                key={step.number}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: reduced ? 0 : 0.7, ease: EASE },
                  },
                }}
                className="flex flex-col items-center md:items-start text-center md:text-left"
              >
                {/* Step number + icon bubble */}
                <div className="relative mb-6">
                  <div
                    className="w-24 h-24 rounded-2xl flex items-center justify-center mb-3"
                    style={{
                      background: `color-mix(in srgb, ${step.accentVar} 10%, var(--color-surface-elevated))`,
                      border: `1px solid color-mix(in srgb, ${step.accentVar} 22%, var(--color-edge-subtle))`,
                      color: step.accentVar,
                    }}
                  >
                    {step.icon}
                  </div>
                  <span
                    className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold tracking-widest"
                    style={{
                      background: step.accentVar,
                      color: "oklch(12% 0 0)",
                    }}
                  >
                    {step.number}
                  </span>
                </div>

                <h3 className="text-[18px] font-semibold text-[var(--color-cream)] mb-2 leading-snug">
                  {step.headline}
                </h3>
                <p className="conduit-body-md leading-relaxed max-w-[22rem]">
                  {step.body}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
