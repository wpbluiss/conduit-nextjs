"use client";

import { Lock, Database, EyeOff, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { BrandMarkStripe } from "@/components/conduit/brand-marks/BrandMarkStripe";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const EASE = [0.25, 1, 0.5, 1] as const;

const PILLARS = [
  {
    icon: <Lock size={20} strokeWidth={1.75} />,
    title: "Encrypted in transit",
    body: "256-bit TLS on every request. Your conversations never travel in plaintext.",
  },
  {
    icon: <Database size={20} strokeWidth={1.75} />,
    title: "Workspace isolation",
    body: "Row-level security enforced at the database layer — one team's data is invisible to another.",
  },
  {
    icon: <BrandMarkStripe size={20} />,
    title: "Payments via Stripe",
    body: "Card data never touches our servers. Stripe handles billing end-to-end.",
  },
  {
    icon: <EyeOff size={20} strokeWidth={1.75} />,
    title: "Your data stays yours",
    body: "We don't sell, share, or use your conversations to train AI models.",
  },
];

export default function TrustBar() {
  const reduced = useReducedMotion();

  return (
    <section
      className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]"
      aria-labelledby="trust-heading"
    >
      <div className="conduit-container">
        <motion.div
          initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: reduced ? 0 : 0.7, ease: EASE }}
          className="max-w-[560px] mb-12 md:mb-14"
        >
          <p className="conduit-caption conduit-caption-ember">Security</p>
          <h2
            id="trust-heading"
            className="conduit-display-xl mt-4"
          >
            Built for work you can&apos;t afford to lose.
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10%" }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: reduced ? 0 : 0.08 } },
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
        >
          {PILLARS.map((p) => (
            <motion.div
              key={p.title}
              variants={{
                hidden: { opacity: 0, y: 14 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: reduced ? 0 : 0.65, ease: EASE },
                },
              }}
              className="flex flex-col gap-3"
            >
              <div
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                style={{
                  background: "var(--color-bg-surface-subtle)",
                  color: "var(--color-ink-secondary)",
                }}
              >
                {p.icon}
              </div>
              <div>
                <p
                  className="text-[14px] font-semibold leading-[1.3]"
                  style={{ color: "var(--color-ink-primary)" }}
                >
                  {p.title}
                </p>
                <p
                  className="text-[13px] leading-relaxed mt-1"
                  style={{ color: "var(--color-ink-tertiary)" }}
                >
                  {p.body}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: reduced ? 0.6 : 0 }}
          whileInView={{ opacity: 0.6 }}
          viewport={{ once: true }}
          transition={{ duration: reduced ? 0 : 0.6, ease: EASE, delay: 0.35 }}
          className="flex items-center gap-2 mt-10"
        >
          <ShieldCheck size={14} strokeWidth={1.75} style={{ color: "var(--color-ink-tertiary)" }} />
          <p
            className="text-[12px]"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            SOC 2 audit in progress · Data processed in the US
          </p>
        </motion.div>
      </div>
    </section>
  );
}
