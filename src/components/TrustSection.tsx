"use client";

import { Lock, Buildings, ShieldCheck, Prohibit } from "@phosphor-icons/react";
import { BrandMarkStripe } from "@/components/conduit/brand-marks/BrandMarkStripe";

const PILLARS = [
  {
    icon: <Lock size={22} weight="fill" className="text-[var(--color-indigo-500)]" />,
    title: "256-bit TLS in transit",
    body: "Every byte between your browser and our servers is encrypted with TLS 1.3.",
  },
  {
    icon: <Buildings size={22} weight="fill" className="text-[var(--color-indigo-500)]" />,
    title: "Bank-level data isolation",
    body: "Supabase Row Level Security ensures your household's data is invisible to all others.",
  },
  {
    icon: (
      <span className="flex items-center">
        <BrandMarkStripe size={22} />
      </span>
    ),
    title: "Payments secured by Stripe",
    body: "We never touch your card. Billing is handled end-to-end by Stripe's certified infrastructure.",
  },
  {
    icon: <ShieldCheck size={22} weight="fill" className="text-[var(--color-indigo-500)]" />,
    title: "Your data stays yours",
    body: "We never sell your data or use it to train AI models — ever.",
  },
] as const;

export default function TrustSection() {
  return (
    <section
      id="trust"
      className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]"
      aria-labelledby="trust-heading"
    >
      <div className="conduit-container">
        <div className="text-center mb-12">
          <h2
            id="trust-heading"
            className="conduit-display-xl"
            style={{ display: "inline" }}
          >
            Built for your{" "}
            <span
              style={{
                textDecoration: "underline",
                textDecorationColor: "var(--color-ember-500)",
                textUnderlineOffset: "6px",
                textDecorationThickness: "2px",
              }}
            >
              most sensitive
            </span>{" "}
            finances
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {PILLARS.map((p) => (
            <div key={p.title} className="flex flex-col gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--color-ink-surface)] border border-[var(--color-edge-subtle)]">
                {p.icon}
              </div>
              <p className="text-[14px] font-semibold text-[var(--color-cream)] leading-snug">
                {p.title}
              </p>
              <p className="text-[13px] text-[var(--color-cream-mute)] leading-relaxed">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
