"use client";

import { motion } from "framer-motion";
import { Quotes } from "@phosphor-icons/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const EASE = [0.25, 1, 0.5, 1] as const;

// Placeholder testimonials — swap with real quotes before launch.
// Use realistic archetypes, no fake company names or identifiable individuals.
const TESTIMONIALS = [
  {
    quote:
      "I replaced a $12k/month contractor with a Praxis specialist. It shipped our entire analytics pipeline in a weekend.",
    role: "Solo founder",
    company: "B2B SaaS",
  },
  {
    quote:
      "The engineering specialist catches bugs I would've shipped. It's like having a senior engineer who never sleeps.",
    role: "CTO",
    company: "Early-stage startup",
  },
  {
    quote:
      "We spun up a voice specialist in an afternoon. Our support queue dropped 60% the first week.",
    role: "Head of Operations",
    company: "Series A startup",
  },
] as const;

const METRICS = [
  { value: "9", label: "Specialist types" },
  { value: "24/7", label: "Ships daily" },
  { value: "$0", label: "Payroll overhead" },
  { value: "7 min", label: "Avg. deploy time" },
] as const;

export default function SocialProof() {
  const reduced = useReducedMotion();

  return (
    <section
      id="social-proof"
      className="relative conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)] overflow-hidden"
    >
      {/* Ambient indigo glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(91,99,232,0.07) 0%, transparent 60%)",
        }}
      />

      <div className="relative conduit-container">
        {/* Section header */}
        <motion.div
          initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: reduced ? 0 : 0.7, ease: EASE }}
          className="text-center mb-16"
        >
          <p className="conduit-caption conduit-caption-indigo">
            Early results · Placeholder
          </p>
          <h2 className="conduit-display-xl mt-4">
            Founders who stopped hiring.{" "}
            <span className="conduit-ember-text">Started deploying.</span>
          </h2>
        </motion.div>

        {/* Metrics strip */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10%" }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: reduced ? 0 : 0.08 } },
          }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
        >
          {METRICS.map((m) => (
            <motion.div
              key={m.label}
              variants={{
                hidden: { opacity: 0, y: 12 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: reduced ? 0 : 0.6, ease: EASE },
                },
              }}
              className="conduit-card p-6 text-center"
            >
              <span
                className="block text-[36px] leading-[1.0] text-[var(--color-cream)] tracking-[-0.03em]"
                style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
              >
                {m.value}
              </span>
              <span className="block text-[12px] uppercase tracking-[0.08em] text-[var(--color-cream-mute)] mt-2">
                {m.label}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonial cards */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10%" }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: reduced ? 0 : 0.1 } },
          }}
          className="grid md:grid-cols-3 gap-6"
        >
          {TESTIMONIALS.map((t) => (
            <motion.div
              key={t.role}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: reduced ? 0 : 0.7, ease: EASE },
                },
              }}
              className="conduit-card p-7 flex flex-col gap-5"
            >
              <Quotes
                size={24}
                weight="fill"
                className="text-[var(--color-indigo-500)] opacity-60 shrink-0"
              />
              <p className="conduit-body-md flex-1 leading-relaxed">{t.quote}</p>
              <div className="border-t border-[var(--color-edge-subtle)] pt-4">
                <span className="block text-[13px] font-medium text-[var(--color-cream)]">
                  {t.role}
                </span>
                <span className="block text-[12px] text-[var(--color-cream-mute)] mt-0.5">
                  {t.company}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Honesty note */}
        <motion.p
          initial={{ opacity: reduced ? 0.6 : 0 }}
          whileInView={{ opacity: 0.6 }}
          viewport={{ once: true }}
          transition={{ duration: reduced ? 0 : 0.6, ease: EASE, delay: 0.3 }}
          className="text-center text-[12px] text-[var(--color-cream-mute)] mt-10"
        >
          Illustrative outcomes — real testimonials coming soon.
        </motion.p>
      </div>
    </section>
  );
}
