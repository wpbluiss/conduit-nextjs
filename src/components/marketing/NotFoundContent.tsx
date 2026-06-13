"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PraxisLogo } from "@/components/conduit/PraxisLogo";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const EASE = [0.25, 1, 0.5, 1] as const;

const CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};
const ITEM = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};
const ITEM_STATIC = {
  hidden: { opacity: 1, y: 0 },
  show: { opacity: 1, y: 0 },
};

export function NotFoundContent() {
  const reduced = useReducedMotion();
  const item = reduced ? ITEM_STATIC : ITEM;

  return (
    <main className="conduit-bg-canvas min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="conduit-mesh" aria-hidden />
      <div className="conduit-ember-radial" aria-hidden />
      <div
        aria-hidden
        className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[600px] h-[280px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center bottom, rgba(255,138,61,0.10) 0%, transparent 65%)",
          filter: "blur(48px)",
        }}
      />

      <motion.div
        initial="hidden"
        animate="show"
        variants={reduced ? {} : CONTAINER}
        className="relative flex flex-col items-center max-w-sm"
      >
        <motion.div variants={item} className="mb-10">
          <Link href="/" aria-label="Back to home">
            <PraxisLogo size={36} glow />
          </Link>
        </motion.div>

        <motion.p
          variants={item}
          className="text-[11px] uppercase tracking-[0.18em] mb-4"
          style={{ color: "var(--color-ink-tertiary)" }}
        >
          404
        </motion.p>

        <motion.h1
          variants={item}
          className="conduit-display-xl mb-4"
        >
          Page not found
        </motion.h1>

        <motion.p
          variants={item}
          className="conduit-body-base mb-10 max-w-xs"
          style={{ color: "var(--color-ink-secondary)", lineHeight: 1.6 }}
        >
          The page you&rsquo;re looking for doesn&rsquo;t exist or has moved.
        </motion.p>

        <motion.div
          variants={item}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto"
        >
          <Link href="/" className="conduit-btn-primary justify-center">
            Back to home
          </Link>
          <Link
            href="/auth/sign-in"
            className="conduit-btn-secondary justify-center"
          >
            Sign in
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
