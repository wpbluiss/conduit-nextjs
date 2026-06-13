"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PraxisLogo } from "@/components/conduit/PraxisLogo";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const EASE = [0.25, 1, 0.5, 1] as const;

const CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const ITEM = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

export default function NotFound() {
  const reduced = useReducedMotion();
  const variants = reduced ? undefined : ITEM;

  return (
    <main className="conduit-bg-inverse min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="conduit-mesh" aria-hidden />
      <div className="conduit-ember-radial" aria-hidden />

      <motion.div
        initial={reduced ? false : "hidden"}
        animate="show"
        variants={reduced ? undefined : CONTAINER}
        className="relative z-10 max-w-sm w-full"
      >
        <motion.div variants={variants} className="mb-8 flex justify-center">
          <PraxisLogo size={36} glow />
        </motion.div>

        <motion.p
          variants={variants}
          className="text-[11px] uppercase tracking-[0.18em] mb-4"
          style={{ color: "var(--color-ink-on-inverse-soft)" }}
        >
          404
        </motion.p>

        <motion.h1
          variants={variants}
          style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 400,
            fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            color: "var(--color-ink-on-inverse)",
            marginBottom: "1rem",
          }}
        >
          Page not found
        </motion.h1>

        <motion.p
          variants={variants}
          className="conduit-body-md mb-10"
          style={{ color: "var(--color-ink-on-inverse-soft)" }}
        >
          The page you&rsquo;re looking for doesn&rsquo;t exist or has moved.
        </motion.p>

        <motion.div
          variants={variants}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            href="/"
            className="conduit-btn-primary justify-center"
            style={{ padding: "12px 24px", fontSize: "14px" }}
          >
            Back to home
          </Link>
          <Link
            href="/auth/sign-in"
            className="text-sm transition-colors"
            style={{ color: "var(--color-ink-on-inverse-soft)" }}
          >
            Sign in →
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
