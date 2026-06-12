"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const FAQ: { q: string; a: string }[] = [
  {
    q: "Can I top up tokens?",
    a: "Yes. Pro and Enterprise can buy $10, $25, or $50 token packs from /app/settings/billing. Top-ups never expire. Free is allowance-only — upgrade to Pro to enable top-ups.",
  },
  {
    q: "What is Praxis Depth?",
    a: "Praxis Flow is the fast model — the one running on most turns. Praxis Depth is the extended-thinking variant: longer reasoning, harder problems, deeper analysis. Atlas decides when Depth is worth it, and it's available on Enterprise. Free and Pro both run Flow.",
  },
  {
    q: "How does multi-user work?",
    a: "Enterprise unlocks multi-user workspaces — invite teammates with role-based access, share memory, run roundtable as a team. The implementation is rolling out across Q3 2026; today it's a single-seat with the upgrade path stamped in.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes — through /app/settings/billing or by emailing luis@conduitai.io. We'll prorate the unused portion. No multi-month contracts on Pro; Enterprise is month-to-month or annual at your choice.",
  },
  {
    q: "What happens when I hit the token cap?",
    a: "Free tier turns off the chat with a friendly notice when you hit the cap. Pro and Enterprise prompt you to top up. The cap rolls over automatically at the start of your next billing cycle.",
  },
  {
    q: "Do you offer custom enterprise plans?",
    a: "Yes — for teams replacing whole departments or running on-prem-style isolation, email luis@conduitai.io. We'll talk through token volume, employee customization, and SLA.",
  },
];

export function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const prefersReduced = useReducedMotion();

  const duration = prefersReduced ? 0 : 0.3;

  return (
    <dl className="mt-12 space-y-3">
      {FAQ.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={item.q}
            className="conduit-card group cursor-pointer"
            style={{
              transition: "transform 150ms ease",
            }}
            onMouseEnter={(e) => {
              if (!isOpen) (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "";
            }}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              className="w-full flex items-start justify-between gap-4 p-6 md:p-7 text-left"
              onClick={() => setOpenIndex(isOpen ? null : i)}
            >
              <dt
                className="text-[18px] md:text-[20px] tracking-[-0.01em] text-[var(--color-cream)]"
                style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
              >
                {item.q}
              </dt>
              <motion.span
                aria-hidden
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration, ease: [0.25, 1, 0.5, 1] }}
                className="shrink-0 mt-1.5 w-6 h-6 rounded-full bg-[var(--color-ink-surface-elevated)] border border-[var(--color-edge)] flex items-center justify-center text-[var(--color-cream-mute)] group-hover:text-[var(--color-indigo-500)] group-hover:border-[var(--color-indigo-500)] transition-colors"
                style={{ fontSize: "14px" }}
              >
                +
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration, ease: [0.25, 1, 0.5, 1] }}
                  style={{ overflow: "hidden" }}
                >
                  <dd className="px-6 md:px-7 pb-6 md:pb-7 text-[15px] md:text-[16px] text-[var(--color-cream-soft)] leading-[1.7]">
                    {item.a}
                  </dd>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </dl>
  );
}
