"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";

const EASE = [0.25, 1, 0.5, 1] as const;

export default function FinalCTA() {
  return (
    <section
      id="cta"
      className="relative py-32 md:py-44 conduit-bg-canvas overflow-hidden border-t border-[var(--color-edge-subtle)]"
    >
      {/* Strong ember mesh */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 50% 100%, rgba(91, 99, 232,0.22), transparent 65%),
            radial-gradient(ellipse 50% 40% at 0% 0%, rgba(168,85,247,0.08), transparent 60%),
            radial-gradient(ellipse 40% 30% at 100% 50%, rgba(91, 99, 232,0.12), transparent 60%)
          `,
        }}
      />

      {/* Center ember aura */}
      <div
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[800px] h-[400px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center bottom, rgba(91, 99, 232,0.35) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
      />

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-15%" }}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.12 } },
        }}
        className="relative max-w-[720px] mx-auto px-6 text-center"
      >
        <motion.h2
          variants={{
            hidden: { opacity: 0, y: 16 },
            show: {
              opacity: 1,
              y: 0,
              transition: { duration: 1.0, ease: EASE },
            },
          }}
          className="conduit-display-2xl"
        >
          Stop hiring. <span className="conduit-ember-text">Start deploying.</span>
        </motion.h2>

        <motion.p
          variants={{
            hidden: { opacity: 0, y: 8 },
            show: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.8, ease: EASE },
            },
          }}
          className="conduit-body-lg mt-6 max-w-[520px] mx-auto"
        >
          Praxis is live. Free to start. The Console is the door.
        </motion.p>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 8 },
            show: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.8, ease: EASE },
            },
          }}
          className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3"
        >
          <Link
            href="/auth/sign-up"
            className="conduit-btn-primary justify-center"
            style={{ padding: "16px 32px", fontSize: "15px" }}
          >
            Open Praxis Console
            <ArrowRight size={16} weight="bold" />
          </Link>
          <Link
            href="/products"
            className="conduit-btn-secondary justify-center"
            style={{ padding: "16px 28px", fontSize: "15px" }}
          >
            See the product family
          </Link>
        </motion.div>

        <motion.p
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { duration: 0.8, ease: EASE, delay: 0.2 },
            },
          }}
          className="mt-8 text-[14px] text-[var(--color-cream-mute)]"
        >
          Or email{" "}
          <Link
            href="mailto:luis@conduitai.io"
            className="text-[var(--color-cream)] underline underline-offset-4 decoration-[var(--color-edge)] hover:decoration-[var(--color-indigo-500)] transition-colors"
          >
            luis@conduitai.io
          </Link>{" "}
          directly.
        </motion.p>
      </motion.div>
    </section>
  );
}
