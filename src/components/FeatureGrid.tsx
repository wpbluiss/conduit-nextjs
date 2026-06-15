"use client";

import { motion } from "framer-motion";
import {
  Sparkle,
  Code,
  TrendUp,
  ChartLine,
  Megaphone,
  Scales,
} from "@phosphor-icons/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const EASE = [0.25, 1, 0.5, 1] as const;
const ICON_CLASS = "text-[var(--color-ember-500)]";

type Feature = {
  icon: React.ReactNode;
  headline: string;
  body: string;
  span?: "wide" | "full";
};

const FEATURES: Feature[] = [
  {
    icon: <Sparkle size={22} weight="duotone" className={ICON_CLASS} />,
    headline: "Always-on Chief of Staff",
    body: "Atlas remembers every decision, routes each request to the right specialist, and runs the follow-through — so nothing falls through the cracks.",
    span: "wide",
  },
  {
    icon: <Code size={22} weight="duotone" className={ICON_CLASS} />,
    headline: "Ship code, not tickets",
    body: "Engineering takes a one-line ask, writes the code, and pushes to prod. Real builds, not summaries.",
  },
  {
    icon: <TrendUp size={22} weight="duotone" className={ICON_CLASS} />,
    headline: "Win more revenue",
    body: "Sales coaches pipelines, drafts cold outreach, and preps every deal review — 24/7, no quota pressure.",
  },
  {
    icon: <ChartLine size={22} weight="duotone" className={ICON_CLASS} />,
    headline: "Finance in real time",
    body: "Model cash flow, reconcile books, and surface anomalies before they hit your runway.",
  },
  {
    icon: <Megaphone size={22} weight="duotone" className={ICON_CLASS} />,
    headline: "Marketing that converts",
    body: "Campaigns, SEO copy, and on-brand content written and shipped without a brief loop.",
  },
  {
    icon: <Scales size={22} weight="duotone" className={ICON_CLASS} />,
    headline: "Legal without a retainer",
    body: "NDAs, compliance checks, and risk flags — on demand, in minutes, not weeks.",
    span: "full",
  },
];

export default function FeatureGrid() {
  const reduced = useReducedMotion();

  return (
    <section
      id="features"
      className="relative conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)] overflow-hidden"
    >
      {/* Subtle radial accent */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,138,61,0.06) 0%, transparent 65%)",
        }}
      />

      <div className="relative conduit-container">
        {/* Section header */}
        <motion.div
          initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: reduced ? 0 : 0.7, ease: EASE }}
          className="max-w-[580px] mb-12 md:mb-16"
        >
          <p className="conduit-caption conduit-caption-ember">Capabilities</p>
          <h2 className="conduit-display-2xl mt-5">
            Nine specialists.{" "}
            <span className="conduit-ember-text">One shared brain.</span>
          </h2>
          <p className="conduit-body-lg mt-5">
            Every role your business needs — running in parallel, handing off
            seamlessly, remembering everything.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.headline}
              initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8%" }}
              transition={{
                duration: reduced ? 0 : 0.65,
                ease: EASE,
                delay: reduced ? 0 : i * 0.08,
              }}
              className={
                f.span === "wide"
                  ? "sm:col-span-2 lg:col-span-2"
                  : f.span === "full"
                    ? "sm:col-span-2 lg:col-span-3"
                    : ""
              }
            >
              <motion.div
                whileHover={reduced ? {} : { y: -4 }}
                transition={{ duration: 0.22, ease: EASE }}
                className="group h-full rounded-2xl border border-[var(--color-edge-subtle)] bg-[var(--color-ink-surface)] p-7 flex flex-col gap-4 transition-[border-color,box-shadow] duration-200 hover:border-[rgba(255,138,61,0.35)] hover:shadow-[0_0_0_1px_rgba(255,138,61,0.12),0_8px_32px_rgba(0,0,0,0.25)]"
              >
                <div
                  className="grid place-items-center w-11 h-11 rounded-xl border border-[var(--color-edge-subtle)] bg-[var(--color-ink-surface-elevated)] transition-colors duration-200 group-hover:border-[rgba(255,138,61,0.4)]"
                >
                  {f.icon}
                </div>

                <div className="flex-1">
                  <h3
                    className="text-[18px] leading-[1.2] tracking-[-0.015em] text-[var(--color-cream)] mb-2"
                    style={{ fontWeight: 600 }}
                  >
                    {f.headline}
                  </h3>
                  <p className="conduit-body-md leading-[1.6] text-[var(--color-ink-on-canvas-soft)]">
                    {f.body}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
