"use client";

import { motion } from "framer-motion";
import {
  Code2,
  ShoppingBag,
  TrendingUp,
  Scale,
  Megaphone,
  HeartPulse,
  Building2,
  Cpu,
} from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const EASE = [0.25, 1, 0.5, 1] as const;

const INDUSTRIES = [
  { icon: Code2,       label: "Dev-tools",  color: "var(--color-dept-engineering)" },
  { icon: ShoppingBag, label: "E-commerce", color: "var(--color-dept-sales)" },
  { icon: TrendingUp,  label: "Fintech",    color: "var(--color-dept-finance)" },
  { icon: Megaphone,   label: "Marketing",  color: "var(--color-dept-marketing)" },
  { icon: Scale,       label: "Legal",      color: "var(--color-dept-legal)" },
  { icon: HeartPulse,  label: "Health",     color: "var(--color-dept-hr)" },
  { icon: Building2,   label: "B2B SaaS",   color: "var(--color-dept-ops)" },
  { icon: Cpu,         label: "AI / ML",    color: "var(--color-dept-compliance)" },
] as const;

const TESTIMONIALS = [
  {
    quote:
      "Praxis cut our go-to-market cycle from eight weeks to four days. The marketing specialist drafted the whole strategy while I slept.",
    name: "Miriam O.",
    role: "Co-founder & CEO",
    company: "B2B SaaS startup",
    initial: "M",
    color: "var(--color-dept-ops)",
  },
  {
    quote:
      "I was burning $11k a month on contractors for work the engineering specialist now handles before breakfast. Shipped our v2 in one sprint.",
    name: "James T.",
    role: "CTO",
    company: "Dev-tools scale-up",
    initial: "J",
    color: "var(--color-dept-engineering)",
  },
  {
    quote:
      "Our sales pipeline tripled in 90 days. The specialist qualifies, drafts outreach, and follows up — zero manual work on my end.",
    name: "Sofia R.",
    role: "Head of Revenue",
    company: "Series A startup",
    initial: "S",
    color: "var(--color-dept-sales)",
  },
] as const;

function IndustryChip({
  icon: Icon,
  label,
  color,
  index,
  reduced,
}: {
  icon: (typeof INDUSTRIES)[number]["icon"];
  label: string;
  color: string;
  index: number;
  reduced: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-5%" }}
      transition={{
        duration: reduced ? 0 : 0.5,
        ease: EASE,
        delay: reduced ? 0 : index * 0.06,
      }}
      className="flex flex-col items-center gap-2 shrink-0"
      style={{ width: 80 }}
    >
      <div
        className="flex items-center justify-center rounded-xl"
        style={{
          width: 48,
          height: 48,
          background: `color-mix(in srgb, ${color} 10%, var(--color-bg-surface-subtle))`,
          border: `1px solid color-mix(in srgb, ${color} 22%, var(--color-edge-subtle))`,
          color,
        }}
        aria-hidden
      >
        <Icon size={22} strokeWidth={1.75} />
      </div>
      <span
        className="text-[11px] font-medium text-center leading-tight"
        style={{ color: "var(--color-ink-tertiary)" }}
      >
        {label}
      </span>
    </motion.div>
  );
}

function TestimonialCard({
  quote,
  name,
  role,
  company,
  initial,
  color,
  index,
  reduced,
}: (typeof TESTIMONIALS)[number] & { index: number; reduced: boolean }) {
  return (
    <motion.blockquote
      initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8%" }}
      transition={{
        duration: reduced ? 0 : 0.65,
        ease: EASE,
        delay: reduced ? 0 : index * 0.1,
      }}
      className="conduit-card flex flex-col gap-4 p-6"
    >
      {/* Quote mark — tinted with the testimonial's dept color for visual identity */}
      <svg
        width="20"
        height="16"
        viewBox="0 0 20 16"
        fill="none"
        aria-hidden
      >
        <path
          d="M0 16V9.6C0 4.267 2.667 1.067 8 0l1.067 1.867C6.4 2.667 4.933 4.4 4.8 7.2H8V16H0Zm12 0V9.6C12 4.267 14.667 1.067 20 0l1.067 1.867C18.4 2.667 16.933 4.4 16.8 7.2H20V16H12Z"
          fill="currentColor"
          style={{ color }}
          opacity={0.45}
        />
      </svg>

      {/* Quote text */}
      <p
        className="text-[14px] leading-[1.65] flex-1"
        style={{ color: "var(--color-ink-secondary)" }}
      >
        {quote}
      </p>

      {/* Attribution */}
      <footer className="flex items-center gap-3 pt-2 border-t border-[var(--color-edge-subtle)]">
        {/* Avatar */}
        <div
          className="flex items-center justify-center rounded-full shrink-0 text-[13px] font-semibold"
          style={{
            width: 36,
            height: 36,
            background: `color-mix(in srgb, ${color} 18%, var(--color-bg-surface-subtle))`,
            color,
          }}
          aria-hidden
        >
          {initial}
        </div>
        <div className="min-w-0">
          <p
            className="text-[13px] font-semibold leading-none truncate"
            style={{ color: "var(--color-ink-primary)" }}
          >
            {name}
          </p>
          <p
            className="text-[11px] mt-1 leading-none truncate"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            {role} · {company}
          </p>
        </div>
      </footer>
    </motion.blockquote>
  );
}

export default function SocialProofSection() {
  const reduced = useReducedMotion();

  return (
    <section
      aria-label="Social proof — industries and founder testimonials"
      className="conduit-bg-canvas border-b border-[var(--color-edge-subtle)]"
    >
      <div className="conduit-container py-14 md:py-16">
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: reduced ? 1 : 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-5%" }}
          transition={{ duration: reduced ? 0 : 0.5, ease: EASE }}
          className="text-center text-[11px] uppercase tracking-[0.1em] font-semibold mb-8"
          style={{ color: "var(--color-dept-ops)" }}
        >
          Founders across every industry
        </motion.p>

        {/* Industry logos row — horizontally scrollable on mobile */}
        <div
          role="list"
          aria-label="Industries using Praxis"
          className="flex gap-5 overflow-x-auto pb-2 md:overflow-x-visible md:pb-0 md:justify-center [&::-webkit-scrollbar]:hidden mb-12 md:mb-14"
          style={{ scrollbarWidth: "none" }}
        >
          {INDUSTRIES.map((ind, i) => (
            <div key={ind.label} role="listitem">
              <IndustryChip
                icon={ind.icon}
                label={ind.label}
                color={ind.color}
                index={i}
                reduced={reduced}
              />
            </div>
          ))}
        </div>

        {/* Testimonials grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5"
          role="list"
          aria-label="Founder testimonials"
        >
          {TESTIMONIALS.map((t, i) => (
            <div key={t.name} role="listitem">
              <TestimonialCard {...t} index={i} reduced={reduced} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
