"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { PraxisLogo } from "@/components/conduit/PraxisLogo";

const EASE = [0.25, 1, 0.5, 1] as const;
const CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};
const ITEM = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

export function NotFoundContent() {
  const reduced = useReducedMotion();
  return (
    <main className="conduit-bg-inverse min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="conduit-mesh" aria-hidden />
      <div className="conduit-ember-radial" aria-hidden />
      <div
        aria-hidden
        className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[700px] h-[300px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center bottom, rgba(255,138,61,0.10) 0%, transparent 65%)",
          filter: "blur(48px)",
        }}
      />

      <motion.div
        initial={reduced ? false : "hidden"}
        animate="show"
        variants={CONTAINER}
        className="relative flex flex-col items-center"
      >
        <motion.div variants={ITEM} className="mb-10">
          <Link href="/" aria-label="Praxis">
            <PraxisLogo size={44} withWordmark glow />
          </Link>
        </motion.div>

        <motion.p
          variants={ITEM}
          className="text-[11px] uppercase tracking-[0.18em] mb-3"
          style={{ color: "var(--color-ink-on-inverse-mute)" }}
        >
          404
        </motion.p>

        <motion.h1
          variants={ITEM}
          className="text-4xl md:text-5xl mb-4"
          style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            color: "var(--color-ink-on-inverse)",
          }}
        >
          This page doesn&rsquo;t exist
        </motion.h1>

        <motion.p
          variants={ITEM}
          className="text-base mb-10 max-w-sm"
          style={{ color: "var(--color-ink-on-inverse-soft)", lineHeight: 1.6 }}
        >
          The page you&rsquo;re looking for doesn&rsquo;t exist or has moved.
        </motion.p>

        <motion.div
          variants={ITEM}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <Link
            href="/app"
            className="conduit-btn-primary-inverse"
            style={{ padding: "12px 24px", fontSize: "14px" }}
          >
            Back to app
          </Link>
          <Link
            href="/"
            className="text-sm"
            style={{ color: "var(--color-ink-on-inverse-mute)" }}
          >
            Go home →
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
