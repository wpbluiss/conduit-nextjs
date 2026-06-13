"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, Quotes } from "@phosphor-icons/react";
import { ProofBar } from "@/components/marketing/ProofBar";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const EASE = [0.25, 1, 0.5, 1] as const;

export default function Customers() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
      <div className="conduit-container">
        <motion.div
          initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.8, ease: EASE }}
          className="max-w-[760px] mb-14 md:mb-20"
        >
          <p className="conduit-caption conduit-caption-ember">
            Running on Praxis
          </p>
          <h2 className="conduit-display-xl mt-5">
            Real businesses. Real workforces.{" "}
            <span className="conduit-ember-text">Real results.</span>
          </h2>
        </motion.div>

        {/* Customer proof bar — quantified gravity (Phase 4 #3) */}
        <ProofBar className="mb-12 md:mb-14" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
          {/* Lunaro card */}
          <motion.div
            initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.8, ease: EASE }}
          >
            <Link
              href="/customers/lunaro"
              className="conduit-card is-celebration group block p-8 md:p-10 h-full min-h-[420px] flex flex-col"
            >
              <div className="flex items-center gap-3 mb-7">
                <svg width="36" height="36" viewBox="0 0 16 16" aria-hidden>
                  <circle cx="8" cy="8" r="6.2" fill="#7C5BFF" />
                  <circle cx="11" cy="6" r="5" fill="#FAFAF7" />
                </svg>
                <span
                  className="text-[20px] tracking-tight text-[var(--color-ink-primary)]"
                  style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                >
                  Lunaro Insurance
                </span>
              </div>

              {/* Stats row — Stripe-style data-forward */}
              <div className="flex items-baseline flex-wrap gap-x-5 gap-y-3 mb-8 pb-8 border-b border-[var(--color-border-subtle)]">
                <Stat n="200+" label="Contacts" />
                <Stat n="6" label="Pipelines" />
                <Stat n="9" label="AI employees" />
              </div>

              {/* Celebration accent — the only place ember lives in v3 body */}
              <Quotes
                size={32}
                weight="duotone"
                color="#D67817"
                className="mb-3 opacity-60"
              />
              <p className="text-[17px] md:text-[19px] text-[var(--color-ink-primary)] leading-[1.55] flex-1 italic">
                The first vertical built on Praxis. From zero to a working CRM
                in a weekend, then turned into a real partnership.
              </p>

              <p className="text-[12px] uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)] mt-7 mb-5">
                Conduit AI &times; Lunaro &middot; 50/50 partnership
              </p>

              <div className="inline-flex items-center gap-1.5 text-[14px] text-[var(--color-ember-500)] font-medium group-hover:gap-2.5 transition-[gap]">
                Read the case study
                <ArrowRight size={14} weight="bold" />
              </div>
            </Link>
          </motion.div>

          {/* Ghost cards */}
          <motion.div
            initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.8, ease: EASE, delay: shouldReduceMotion ? 0 : 0.1 }}
            className="grid grid-rows-2 gap-5 lg:gap-6"
          >
            <GhostCard caption="Customer story · soon" />
            <GhostCard caption="Customer story · soon" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.8, ease: EASE, delay: shouldReduceMotion ? 0 : 0.2 }}
          className="mt-12 text-center"
        >
          <Link
            href="/customers"
            className="inline-flex items-center gap-2 text-[14px] text-[var(--color-cream-soft)] hover:text-[var(--color-indigo-500)] transition-colors"
          >
            See all customers
            <ArrowRight size={14} weight="bold" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <span
        className="block text-[28px] md:text-[32px] leading-[1.0] text-[var(--color-cream)] tracking-[-0.025em]"
        style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
      >
        {n}
      </span>
      <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--color-cream-mute)] mt-1.5 block">
        {label}
      </span>
    </div>
  );
}

function GhostCard({ caption }: { caption: string }) {
  return (
    <Link
      href="mailto:luis@conduitai.io?subject=Become%20a%20customer"
      className="group rounded-2xl border border-dashed border-[var(--color-border-default)] hover:border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[200px] opacity-60 hover:opacity-90 transition-[opacity,border-color,transform] duration-300 hover:scale-[1.01]"
    >
      <Briefcase
        size={28}
        weight="duotone"
        className="text-[var(--color-ink-tertiary)]"
      />
      <p className="conduit-caption text-[var(--color-ink-tertiary)]">
        {caption}
      </p>
      <span className="text-[13px] text-[var(--color-indigo-500)] inline-flex items-center gap-1 group-hover:gap-1.5 transition-[gap]">
        Become a customer
        <ArrowRight size={12} weight="bold" />
      </span>
    </Link>
  );
}
