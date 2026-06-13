"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { PraxisLogo } from "@/components/conduit/PraxisLogo";

const EASE = [0.25, 1, 0.5, 1] as const;

export default function NotFound() {
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

      {/* Content */}
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
          404
        </motion.p>

        <motion.h1
          variants={{
            hidden: { opacity: 0, y: 12 },
            show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
          }}
          className="mt-3 conduit-display-xl"
        >
          Page not found
        </motion.h1>

        <motion.p
          variants={{
            hidden: { opacity: 0, y: 8 },
            show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
          }}
          className="mt-4 text-[15px] text-[var(--color-cream-soft)] leading-[1.6] max-w-[360px]"
        >
          The page you&rsquo;re looking for doesn&rsquo;t exist or has moved.
        </motion.p>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 8 },
            show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
          }}
          className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3"
        >
          <Link href="/" className="conduit-btn-primary justify-center">
            <ArrowLeft size={15} weight="bold" />
            Back to home
          </Link>
          <Link href="/auth/sign-in" className="conduit-btn-secondary justify-center">
            Sign in
            <ArrowRight size={15} weight="bold" />
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
