"use client";

import { motion } from "framer-motion";
import { Buildings, ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";

const EASE = [0.25, 1, 0.5, 1] as const;

const CAPTIONS = [
  "→ marketing room: campaign drafted live",
  "→ engineering bay: build deploying",
  "→ boardroom: roundtable in session",
];

export default function Cinematic() {
  return (
    <section className="relative conduit-bg-canvas overflow-hidden border-y border-[var(--color-edge-subtle)]">
      {/* Top gradient line */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 1.6, ease: EASE }}
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
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="text-center max-w-[820px] mx-auto mb-12 md:mb-16"
        >
          <p className="conduit-caption conduit-caption-ember">
            Praxis HQ · Coming Q3 2026
          </p>
          <h2 className="conduit-display-2xl mt-6">
            Walk into a company you don&rsquo;t have to staff.
          </h2>
          <p className="conduit-body-lg mt-6 max-w-[600px] mx-auto">
            A spatial workspace where each employee has a desk, an avatar, a
            voice. Step into a room and the work is already happening.
          </p>
        </motion.div>

        {/* Video container with fallback */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 24 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1.2, ease: EASE }}
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

          {/* Frame — ember-glow celebration ring around the cinematic moment */}
          <div
            className="relative conduit-inverse aspect-[16/9] rounded-2xl overflow-hidden bg-[var(--color-ink-surface)]"
            style={{
              boxShadow:
                "inset 0 0 0 1px rgba(214, 120, 23, 0.28), 0 0 80px rgba(214, 120, 23, 0.18), 0 32px 80px rgba(15, 17, 21, 0.16)",
            }}
          >
            <CinematicFallback />

            {/* Corner accent overlay — ember celebration tone */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 50% 50% at 90% 10%, rgba(214, 120, 23, 0.10) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 10% 90%, rgba(91, 99, 232, 0.08) 0%, transparent 60%)",
              }}
            />
          </div>
        </motion.div>

        {/* Mono captions */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10%" }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.12, delayChildren: 0.4 },
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
                  transition: { duration: 0.6, ease: EASE },
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
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.8 }}
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

function CinematicFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-ink-canvas)]">
      {/* Indigo-mesh backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 45%, rgba(91, 99, 232, 0.22) 0%, transparent 70%), radial-gradient(ellipse 40% 50% at 20% 100%, rgba(168, 175, 251, 0.10) 0%, transparent 65%)",
        }}
      />

      {/* Subtle grid pattern */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #F5EFE6 1px, transparent 1px), linear-gradient(to bottom, #F5EFE6 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-[760px]">
        <p className="conduit-caption text-[var(--color-ink-tertiary)]">
          Cinematic preview · Q3 2026
        </p>

        <div className="relative mt-8 mb-10">
          <div
            aria-hidden
            className="absolute inset-[-40px] pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at center, rgba(168, 175, 251, 0.35) 0%, transparent 70%)",
              filter: "blur(24px)",
            }}
          />
          <Buildings
            size={96}
            weight="duotone"
            color="#A8AFFB"
            className="relative"
          />
        </div>

        <h3 className="conduit-display-lg text-[var(--color-cream)]">
          Walk into a company you don&rsquo;t have to staff.
        </h3>
      </div>
    </div>
  );
}
