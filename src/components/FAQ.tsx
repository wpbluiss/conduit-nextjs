"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "@phosphor-icons/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const EASE = [0.25, 1, 0.5, 1] as const;

const FAQS = [
  {
    q: "How does Praxis pricing work?",
    a: "Praxis has three tiers — Free, Pro, and Enterprise — each with a monthly token allowance that powers your AI specialists. You can also buy one-time token top-ups ($10 / $25 / $50) that stack on top of your allowance and never expire. See the pricing page for current rates.",
  },
  {
    q: "What can the AI specialists actually do?",
    a: "Each specialist is a context-aware AI employee tuned for its domain. Atlas (your chief of staff) routes tasks; Marketing drafts copy and campaigns; Sales writes outreach; Engineering reviews code and opens PRs; Finance analyzes your business numbers; Compliance flags risks; HR drafts policies; Ops coordinates workflows; Legal reviews contracts. All share a unified memory of your business.",
  },
  {
    q: "How is my data kept private and secure?",
    a: "Your data lives in an isolated Supabase Postgres instance with row-level security — only your account can read your records. Data in transit is encrypted via TLS. We never use your conversations to train models. You can export or delete your data at any time from Settings.",
  },
  {
    q: "Can I cancel my subscription at any time?",
    a: "Yes. Cancel any time from Settings → Billing → Manage subscription. You keep full access until the end of your billing cycle. We don't do lock-ins or cancellation fees.",
  },
  {
    q: "Can I invite my team into Praxis?",
    a: "Yes. Invite teammates to your workspace from Settings. Everyone shares the same specialists, business context, and conversation history, so your AI workforce stays in sync across your whole team.",
  },
  {
    q: "Which platforms is Praxis available on?",
    a: "Praxis runs in any modern browser (desktop and mobile-responsive) and installs to your phone's home screen as an app (PWA). Native iOS and Android apps are in development. All surfaces share the same AI specialists and persistent memory.",
  },
  {
    q: "Do I need technical skills to use Praxis?",
    a: "No. You work with your specialists in plain language — describe what you need and they draft, analyze, and ship it. The Engineering specialist handles the code so you don't have to.",
  },
  {
    q: "How is Praxis different from a chatbot or a typical SaaS tool?",
    a: "A chatbot answers questions; a SaaS tool just stores your work. Praxis specialists are active agents — they draft, analyze, coordinate, and ship on your behalf, with shared memory of your business. It's the difference between a tool and an actual team.",
  },
];

export const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

function AccordionItem({
  q,
  a,
  open,
  onToggle,
  reduced,
  index,
}: {
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
  reduced: boolean;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-6%" }}
      transition={{ duration: reduced ? 0 : 0.5, ease: EASE, delay: reduced ? 0 : index * 0.05 }}
      className="border-b border-[var(--color-edge-subtle)]"
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 py-5 text-left"
      >
        <span className="text-[15px] font-medium text-[var(--color-cream)] leading-[1.4]">
          {q}
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: reduced ? 0 : 0.2, ease: EASE }}
          className="mt-0.5 shrink-0 text-[var(--color-indigo-400,#818cf8)]"
        >
          <Plus size={18} weight="bold" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.28, ease: EASE }}
            style={{ overflow: "hidden" }}
          >
            <p className="pb-5 text-[14px] text-[var(--color-cream-mute)] leading-[1.65]">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState<number | null>(null);

  const toggle = (i: number) => setOpen((prev: number | null) => (prev === i ? null : i));

  return (
    <section
      id="faq"
      className="relative conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)] overflow-hidden"
    >
      {/* Subtle ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(91,99,232,0.07), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-3xl px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8%" }}
          transition={{ duration: reduced ? 0 : 0.6, ease: EASE }}
          className="mb-12 text-center"
        >
          <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-indigo-400,#818cf8)] mb-4">
            FAQ
          </div>
          <h2 className="text-[clamp(2rem,5vw,3rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--color-cream)]">
            Questions?
          </h2>
          <div
            aria-hidden
            className="mx-auto mt-4 h-px w-12"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--color-indigo-400,#818cf8), transparent)",
            }}
          />
        </motion.div>

        {/* Accordion */}
        <div>
          {FAQS.map(({ q, a }, i) => (
            <AccordionItem
              key={q}
              q={q}
              a={a}
              open={open === i}
              onToggle={() => toggle(i)}
              reduced={reduced}
              index={i}
            />
          ))}
        </div>
      </div>

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />
    </section>
  );
}
