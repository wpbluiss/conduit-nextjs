"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";

const EASE = [0.25, 1, 0.5, 1] as const;

export default function Vision() {
  return (
    <section
      id="vision"
      className="relative conduit-section conduit-bg-inverse overflow-hidden"
    >
      <div className="conduit-ember-radial" aria-hidden />
      <div className="conduit-mesh-inverse" aria-hidden />
      <div className="conduit-container relative z-10">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-15%" }}
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
          className="conduit-prose"
        >
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.8, ease: EASE },
              },
            }}
            className="conduit-caption conduit-caption-ember"
          >
            The bet
          </motion.p>

          <motion.h2
            variants={{
              hidden: { opacity: 0, y: 16 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: 1.0, ease: EASE },
              },
            }}
            className="conduit-display-xl mt-6"
          >
            The next decade doesn&rsquo;t belong to companies that hire faster.
            It belongs to{" "}
            <span className="conduit-text-gradient-inverse">
              companies that don&rsquo;t hire at all.
            </span>
          </motion.h2>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.8, ease: EASE },
              },
            }}
            className="space-y-6 mt-12 text-[17px] md:text-[19px] text-[var(--color-ink-on-inverse-soft)] leading-[1.7]"
          >
            <p>
              The default for running a business is still a payroll system, an
              HR vendor, and a Slack full of people doing tasks software could
              do. We think that&rsquo;s a transitional state, not a permanent
              one.
            </p>

            <p>
              Praxis is a workforce that works the way the best teams work — a
              Chief of Staff who actually remembers what you said three weeks
              ago, specialists who ship instead of summarize, and a single
              place where you can talk to all of them at once.
            </p>
          </motion.div>

          {/* Pull-quote */}
          <motion.blockquote
            variants={{
              hidden: { opacity: 0, x: -8 },
              show: {
                opacity: 1,
                x: 0,
                transition: { duration: 0.8, ease: EASE },
              },
            }}
            className="conduit-pullquote my-12 md:my-16"
          >
            No Slack threads. No payroll. No standups. Just work, shipped.
          </motion.blockquote>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 8 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.8, ease: EASE },
              },
            }}
          >
            <Link
              href="/approach"
              className="inline-flex items-center gap-2 text-[15px] text-[var(--color-indigo-300)] hover:gap-3 transition-[gap] font-medium"
            >
              Read the full thesis
              <ArrowRight size={14} weight="bold" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
