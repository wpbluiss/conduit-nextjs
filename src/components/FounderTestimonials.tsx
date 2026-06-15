"use client";

import { motion } from "framer-motion";

const EASE = [0.25, 1, 0.5, 1] as const;

const TESTIMONIALS = [
  {
    quote:
      "Praxis pays for itself in the first week. Our engineering specialist shipped a feature that would've cost $8k in contractor hours — I paid $49.",
    name: "Alex R.",
    role: "Solo founder",
    company: "Dev-tools SaaS",
    initial: "A",
    accentVar: "--color-indigo-500",
  },
  {
    quote:
      "I was skeptical of the pricing until I ran the numbers. We replaced a $15k/month marketing agency. The ROI was obvious in the first campaign.",
    name: "Priya S.",
    role: "Co-founder & CMO",
    company: "E-commerce brand",
    initial: "P",
    accentVar: "--color-dept-marketing",
  },
  {
    quote:
      "The Pro plan was a no-brainer. Within 30 days our sales specialist had qualified 200 leads and drafted every follow-up sequence. Pipeline tripled.",
    name: "Daniel K.",
    role: "Head of Growth",
    company: "Series A startup",
    initial: "D",
    accentVar: "--color-dept-sales",
  },
  {
    quote:
      "We had a compliance audit coming up. The legal and compliance specialists produced a gap analysis and policy drafts in two days. That alone was worth a year of Pro.",
    name: "Yuki M.",
    role: "CTO & Co-founder",
    company: "Fintech scale-up",
    initial: "Y",
    accentVar: "--color-accent",
  },
] as const;

export default function FounderTestimonials() {
  return (
    <section
      id="founder-testimonials"
      className="relative conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)] overflow-hidden"
    >
      {/* Ambient ember glow to carry energy from the Pricing section above */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 55% 35% at 50% 100%, color-mix(in srgb, var(--color-accent) 6%, transparent) 0%, transparent 70%)",
        }}
      />

      <div className="relative conduit-container">
        {/* Section header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <p className="conduit-caption conduit-caption-indigo mb-4">
            Founder results
          </p>
          <h2 className="conduit-display-xl">
            The plan that{" "}
            <span className="conduit-ember-text">paid for itself.</span>
          </h2>
        </motion.div>

        {/* Testimonial grid — 2-col on md+, 1-col on mobile */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.1 } },
          }}
        >
          {TESTIMONIALS.map((t) => (
            <motion.div
              key={t.name}
              variants={{
                hidden: { opacity: 0, y: 18 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.65, ease: EASE },
                },
              }}
              className="conduit-card p-7 flex flex-col gap-5"
            >
              {/* Decorative quote mark */}
              <span
                aria-hidden
                className="text-[40px] leading-none font-serif select-none"
                style={{
                  color: `var(${t.accentVar})`,
                  opacity: 0.35,
                  lineHeight: 1,
                }}
              >
                &ldquo;
              </span>

              <p className="conduit-body-md leading-relaxed flex-1 -mt-3">
                {t.quote}
              </p>

              {/* Attribution */}
              <div className="flex items-center gap-3 border-t border-[var(--color-edge-subtle)] pt-5">
                <span
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold shrink-0"
                  style={{
                    background: `color-mix(in srgb, var(${t.accentVar}) 15%, var(--color-bg-surface-elevated, var(--color-surface-elevated)))`,
                    color: `var(${t.accentVar})`,
                    boxShadow: `inset 0 0 0 1px color-mix(in srgb, var(${t.accentVar}) 25%, transparent)`,
                  }}
                >
                  {t.initial}
                </span>
                <div>
                  <span className="block text-[13px] font-medium text-[var(--color-cream)]">
                    {t.name}
                  </span>
                  <span className="block text-[12px] text-[var(--color-cream-mute)] mt-0.5">
                    {t.role} · {t.company}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Honesty note */}
        <p className="text-center text-[12px] text-[var(--color-cream-mute)] mt-10 opacity-60">
          Illustrative outcomes — real testimonials coming soon.
        </p>
      </div>
    </section>
  );
}
