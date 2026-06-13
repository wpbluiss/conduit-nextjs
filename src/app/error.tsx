"use client";

// Root-level error boundary for the marketing site. Next.js 16 mounts this
// when any page outside /app throws during render.

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowCounterClockwise } from "@phosphor-icons/react";
import { PraxisLogo } from "@/components/conduit/PraxisLogo";

interface Props {
  error: Error & { digest?: string };
  unstable_retry?: () => void;
  reset?: () => void;
}

const EASE = [0.25, 1, 0.5, 1] as const;

export default function RootError({ error, unstable_retry, reset }: Props) {
  const retry = unstable_retry ?? reset;

  useEffect(() => {
    if (error.digest) console.error("RootError digest:", error.digest);
  }, [error]);

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-6 py-24 text-center conduit-bg-canvas overflow-hidden">
      {/* Mesh + ember radial backgrounds */}
      <div className="conduit-mesh" aria-hidden />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 60%, rgba(91,99,232,0.14), transparent 65%)",
        }}
      />

      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
        }}
        className="relative z-10 flex flex-col items-center"
      >
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 8 },
            show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
          }}
        >
          <PraxisLogo size={32} glow />
        </motion.div>

        <motion.p
          variants={{
            hidden: { opacity: 0, y: 8 },
            show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
          }}
          className="mt-8 text-[11px] uppercase tracking-[0.18em] text-[var(--color-cream-mute)]"
        >
          500
        </motion.p>

        <motion.h1
          variants={{
            hidden: { opacity: 0, y: 12 },
            show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
          }}
          className="mt-3 conduit-display-xl"
        >
          Something went wrong
        </motion.h1>

        <motion.p
          variants={{
            hidden: { opacity: 0, y: 8 },
            show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
          }}
          className="mt-4 text-[15px] text-[var(--color-cream-soft)] leading-[1.6] max-w-[360px]"
        >
          An unexpected error occurred. Your work is safe — try reloading or return to the homepage.
        </motion.p>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 8 },
            show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
          }}
          className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3"
        >
          {retry && (
            <button
              type="button"
              onClick={retry}
              className="conduit-btn-primary justify-center"
            >
              <ArrowCounterClockwise size={15} weight="bold" />
              Try again
            </button>
          )}
          <Link href="/" className="conduit-btn-secondary justify-center">
            <ArrowLeft size={15} weight="bold" />
            Back to home
          </Link>
        </motion.div>

        <motion.p
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { duration: 0.6, ease: EASE, delay: 0.2 } },
          }}
          className="mt-12 text-[13px] text-[var(--color-cream-mute)]"
        >
          conduitai.io
        </motion.p>
      </motion.div>
    </main>
  );
}
