"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { PraxisLogo } from "@/components/conduit/PraxisLogo";

const EASE = [0.25, 1, 0.5, 1] as const;
const CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const ITEM = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

interface Props {
  error: Error & { digest?: string };
  unstable_retry?: () => void;
  reset?: () => void;
}

export default function RootError({ error, unstable_retry, reset }: Props) {
  const retry = unstable_retry ?? reset;
  const reduced = useReducedMotion();

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="conduit-bg-inverse min-h-[60vh] relative overflow-hidden flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="conduit-mesh" aria-hidden />
      <div className="conduit-ember-radial" aria-hidden />
      <div
        aria-hidden
        className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[600px] h-[260px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center bottom, rgba(255,138,61,0.08) 0%, transparent 65%)",
          filter: "blur(40px)",
        }}
      />

      <motion.div
        initial={reduced ? false : "hidden"}
        animate="show"
        variants={CONTAINER}
        className="relative flex flex-col items-center max-w-md"
      >
        <motion.div variants={ITEM} className="mb-8">
          <Link href="/" aria-label="Praxis">
            <PraxisLogo size={36} withWordmark glow />
          </Link>
        </motion.div>

        <motion.p
          variants={ITEM}
          className="text-[11px] uppercase tracking-[0.18em] mb-3"
          style={{ color: "var(--color-ink-on-inverse-mute)" }}
        >
          500
        </motion.p>

        <motion.h1
          variants={ITEM}
          className="text-3xl md:text-4xl mb-3"
          style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
            color: "var(--color-ink-on-inverse)",
          }}
        >
          Something went wrong
        </motion.h1>

        <motion.p
          variants={ITEM}
          className="text-sm mb-8"
          style={{ color: "var(--color-ink-on-inverse-soft)", lineHeight: 1.6 }}
        >
          An unexpected error occurred. Please try again or return to the
          homepage.
        </motion.p>

        <motion.div
          variants={ITEM}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          {retry && (
            <button
              type="button"
              onClick={retry}
              className="conduit-btn-primary-inverse"
              style={{ padding: "12px 24px", fontSize: "14px" }}
            >
              Try again
            </button>
          )}
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
