"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "@phosphor-icons/react";

const EASE = [0.25, 1, 0.5, 1] as const;

type Tier = {
  name: string;
  price: string;
  priceSuffix?: string;
  tagline: string;
  features: string[];
  cta: { label: string; href: string };
  popular?: boolean;
  ctaPrimary?: boolean;
};

// Mirrors the runtime tiers in src/lib/billing/tiers.ts so the marketing
// promise matches what the Praxis Console actually sells.
const TIERS: Tier[] = [
  {
    name: "Free",
    price: "$0",
    priceSuffix: "/mo",
    tagline: "For founders kicking the tires.",
    features: [
      "Praxis Flow — fast model",
      "Atlas + Marketing employees",
      "50k tokens / month",
      "Voice input in chat",
    ],
    cta: { label: "Open Praxis", href: "/auth/sign-up" },
  },
  {
    name: "Pro",
    price: "$29",
    priceSuffix: "/mo",
    tagline: "For solo founders running a real business.",
    features: [
      "Praxis Flow — adaptive routing",
      "Atlas + Marketing + Sales + Engineering",
      "1M tokens / month",
      "30 voice minutes per day",
      "Real lead pipelines + real builds",
    ],
    cta: { label: "Start Pro", href: "/auth/sign-up?tier=pro" },
    popular: true,
    ctaPrimary: true,
  },
  {
    name: "Enterprise",
    price: "$199",
    priceSuffix: "/mo",
    tagline: "For teams replacing whole departments.",
    features: [
      "Praxis Depth — extended thinking",
      "All 9 employees (Finance, Compliance, HR, Ops, Legal)",
      "5M tokens / month",
      "Unlimited voice + roundtable",
      "Multi-user + priority routing",
    ],
    cta: { label: "Talk to founder", href: "mailto:luis@conduitai.io" },
  },
];

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="relative conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)] overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute -top-40 right-0 w-[700px] h-[700px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(91, 99, 232,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="relative conduit-container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="text-center max-w-[760px] mx-auto mb-16 md:mb-20"
        >
          <p className="conduit-caption conduit-caption-ember">Pricing</p>
          <h2 className="conduit-display-xl mt-5">
            Three tiers.{" "}
            <span className="conduit-ember-text">One workforce.</span>
          </h2>
          <p className="conduit-body-lg mt-6 max-w-[600px] mx-auto">
            Praxis Flow runs everywhere. Praxis Depth (extended thinking) kicks
            in on Enterprise for the reasoning-heavy turns.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 items-stretch">
          {TIERS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.8, ease: EASE, delay: i * 0.08 }}
              className={t.popular ? "md:-my-3 md:scale-[1.02]" : ""}
            >
              <div
                className={`conduit-card relative p-8 md:p-10 h-full flex flex-col ${
                  t.popular ? "is-featured" : ""
                }`}
              >
                {t.popular && (
                  <span className="conduit-badge conduit-badge-popular absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </span>
                )}

                <p className="conduit-caption text-[var(--color-cream-mute)] mb-6">
                  {t.name}
                </p>
                <div className="flex items-baseline gap-1 mb-3">
                  <span
                    className="text-[56px] md:text-[64px] leading-[0.95] tracking-[-0.035em] text-[var(--color-cream)]"
                    style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                  >
                    {t.price}
                  </span>
                  {t.priceSuffix && (
                    <span className="text-[18px] text-[var(--color-cream-mute)]">
                      {t.priceSuffix}
                    </span>
                  )}
                </div>
                <p className="text-[14px] text-[var(--color-cream-soft)] mb-7 leading-[1.55]">
                  {t.tagline}
                </p>

                <div className="h-px bg-[var(--color-edge-subtle)] mb-7" />

                <ul className="space-y-3.5 mb-10 flex-1">
                  {t.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-3 text-[14px] text-[var(--color-cream)] leading-[1.55]"
                    >
                      <Check
                        size={14}
                        weight="bold"
                        color={t.popular ? "#5B63E8" : "#9DD8B1"}
                        className="mt-1 shrink-0"
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={t.cta.href}
                  className={`${t.ctaPrimary ? "conduit-btn-primary" : "conduit-btn-secondary"} justify-center w-full`}
                >
                  {t.cta.label}
                  <ArrowRight size={14} weight="bold" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.3 }}
          className="text-center mt-14 md:mt-16 text-[14px] text-[var(--color-cream-mute)] max-w-[640px] mx-auto leading-[1.6]"
        >
          Top up tokens any time — $10 / $25 / $50 packs from the{" "}
          <Link
            href="/app/settings/billing"
            className="text-[var(--color-cream)] hover:text-[var(--color-indigo-500)] underline underline-offset-2 decoration-[var(--color-edge)] hover:decoration-[var(--color-indigo-500)] transition-colors"
          >
            billing settings
          </Link>{" "}
          inside the Console.
        </motion.p>
      </div>
    </section>
  );
}
