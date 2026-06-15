"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "@phosphor-icons/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const EASE = [0.25, 1, 0.5, 1] as const;
import {
  Code2,
  Compass,
  DollarSign,
  HeartHandshake,
  Megaphone,
  Scale,
  ShieldCheck,
  TrendingUp,
  Workflow,
} from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

interface Row {
  label: string;
  traditional: string;
  praxis: string;
  // If set, the Praxis cell gets a count-up number animation for this value.
  countUp?: { value: number; prefix?: string; suffix?: string };
}

const ROWS: Row[] = [
  {
    label: "Time to first deliverable",
    traditional: "3–6 months\nHiring pipeline, onboarding, ramp-up",
    praxis: "Under 5 minutes\nDescribe your business, get your first output",
  },
  {
    label: "Cost per month",
    traditional: "$50,000+/mo\nSalaries, benefits, recruiting fees",
    praxis: "$29–$99/mo\nAll 9 specialists, one subscription",
    countUp: { value: 29, prefix: "$", suffix: "/mo" },
  },
  {
    label: "Availability",
    traditional: "9–5, Mon–Fri\nTime zones, PTO, sick days",
    praxis: "24/7, no holidays\nAlways-on — no context switching",
  },
  {
    label: "Specialties covered",
    traditional: "3–5 roles\nGaps between departments",
    praxis: "9 specialists\nMarketing, Sales, Engineering, Legal, Finance,\nHR, Compliance, Ops, Chief of Staff",
  },
  {
    label: "Onboarding time",
    traditional: "Weeks to months\nDocs, tooling, culture ramp",
    praxis: "Instant\nSpecialists come pre-trained on your brief",
  },
  {
    label: "Contract / severance risk",
    traditional: "High\nLegal obligations, severance, equity vesting",
    praxis: "None\nCancel any time — no contracts, no commitments",
  },
  {
    label: "Iteration speed",
    traditional: "Days to weeks\nMeetings, approvals, handoffs",
    praxis: "Seconds\nChange direction mid-thread, no lag",
  },
  {
    label: "Memory across projects",
    traditional: "Lost on departure\nKnowledge walks out with the hire",
    praxis: "Persistent\nEvery decision remembered, no re-briefing",
  },
];

// 9-dept icon strip for the Praxis column header
const DEPT_ICONS = [
  { Icon: Compass, color: "var(--color-dept-jarvis, #8B8BF0)", label: "Atlas" },
  { Icon: Megaphone, color: "var(--color-dept-marketing, #F06292)", label: "Marketing" },
  { Icon: TrendingUp, color: "var(--color-dept-sales, #66BB6A)", label: "Sales" },
  { Icon: Code2, color: "var(--color-dept-engineering, #4FC3F7)", label: "Engineering" },
  { Icon: DollarSign, color: "var(--color-dept-finance, #FFB74D)", label: "Finance" },
  { Icon: ShieldCheck, color: "var(--color-dept-compliance, #BA68C8)", label: "Compliance" },
  { Icon: HeartHandshake, color: "var(--color-dept-hr, #F48FB1)", label: "HR" },
  { Icon: Workflow, color: "var(--color-dept-ops, #4DB6AC)", label: "Ops" },
  { Icon: Scale, color: "var(--color-dept-legal, #90CAF9)", label: "Legal" },
];

const ACCENT = "rgba(91,99,232,0.14)";
const ACCENT_BORDER = "rgba(91,99,232,0.30)";
const PRAXIS_BLUE = "#818CF8";

// ─── Count-up hook ────────────────────────────────────────────────────────────

function useCountUp(target: number, active: boolean): number {
  const [count, setCount] = useState(0);
  const frame = useRef<ReturnType<typeof requestAnimationFrame>>(undefined);

  useEffect(() => {
    if (!active) return;
    const duration = 1200;
    const start = performance.now();

    function tick(now: number) {
      const pct = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - pct, 5);
      setCount(Math.round(eased * target));
      if (pct < 1) frame.current = requestAnimationFrame(tick);
    }

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    };
  }, [active, target]);

  return count;
}

// ─── Praxis cost cell with count-up ──────────────────────────────────────────

function CostCell({
  text,
  countUp,
  active,
}: {
  text: string;
  countUp: Row["countUp"];
  active: boolean;
}) {
  const value = useCountUp(countUp?.value ?? 0, active && Boolean(countUp));
  if (!countUp) return <>{text}</>;

  const lines = text.split("\n");
  const rest = lines.slice(1).join("\n");

  return (
    <>
      <span className="text-[22px] font-bold leading-none" style={{ color: PRAXIS_BLUE }}>
        {countUp.prefix}
        {value}
        {countUp.suffix}
      </span>
      {rest && (
        <span className="block mt-1 text-[13px] leading-[1.55] whitespace-pre-line">
          {rest}
        </span>
      )}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WhyPraxisTable() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]"
    >
      <div className="conduit-container">
        {/* Header */}
        <motion.div
          className="max-w-[640px] mb-12 md:mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <p className="conduit-caption conduit-caption-ember">Why Praxis</p>
          <h2 className="conduit-display-2xl mt-5">
            Nine specialists. Zero payroll.
          </h2>
          <p className="mt-5 text-[17px] leading-[1.7] text-[var(--color-cream-mute)]">
            A full-time team covering your go-to-market, engineering, finance,
            and legal costs over $600,000 a year — before you sell a single
            dollar. Praxis gives you the same depth for the price of a Spotify
            subscription.
          </p>
        </motion.div>

        {/* Mobile: stacked card per row */}
        <div className="md:hidden space-y-3">
          {ROWS.map((row, index) => (
            <motion.div
              key={row.label}
              initial={reduced ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, ease: EASE, delay: reduced ? 0 : index * 0.06 }}
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid var(--color-edge-subtle)" }}
            >
              <div
                className="px-4 py-2 text-[11px] uppercase tracking-[0.12em] font-semibold text-[var(--color-cream-mute)]"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                {row.label}
              </div>
              <div className="grid grid-cols-2 divide-x divide-[var(--color-edge-subtle)]">
                <div className="px-4 py-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <X size={13} weight="bold" className="text-[var(--color-cream-mute)] shrink-0" />
                    <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--color-cream-mute)]">
                      Traditional
                    </span>
                  </div>
                  <p className="text-[13px] text-[var(--color-cream-soft)] leading-[1.55] whitespace-pre-line">
                    {row.traditional}
                  </p>
                </div>
                <div className="px-4 py-4" style={{ background: ACCENT }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Check size={13} weight="bold" style={{ color: PRAXIS_BLUE }} className="shrink-0" />
                    <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: PRAXIS_BLUE }}>
                      Praxis
                    </span>
                  </div>
                  <p className="text-[13px] text-[var(--color-cream)] leading-[1.55]">
                    {row.countUp ? (
                      <CostCell text={row.praxis} countUp={row.countUp} active={inView} />
                    ) : (
                      <span className="whitespace-pre-line">{row.praxis}</span>
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Desktop: proper table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead>
              <motion.tr
                className="border-b border-[var(--color-edge)]"
                initial={reduced ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
              >
                <th className="text-left p-5 text-[12px] uppercase tracking-[0.08em] text-[var(--color-cream-mute)] font-semibold w-1/4">
                  Area
                </th>
                <th className="text-left p-5 w-[37%]">
                  <div className="flex items-center gap-2">
                    <X size={14} weight="bold" className="text-[var(--color-cream-mute)]" />
                    <span className="text-[13px] font-semibold text-[var(--color-cream-mute)]">
                      Traditional hire(s)
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-[var(--color-cream-mute)] font-normal">
                    Salaries, benefits, contracts, ramp-up
                  </p>
                </th>
                <th
                  className="text-left p-5 w-[37%] relative"
                  style={{
                    background: ACCENT,
                    borderRadius: "12px 12px 0 0",
                    border: `1px solid ${ACCENT_BORDER}`,
                    borderBottom: "none",
                  }}
                >
                  <div
                    aria-hidden
                    className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{ background: "#5B63E8", borderRadius: "12px 12px 0 0" }}
                  />
                  {/* Dept icon strip */}
                  <div className="flex items-center gap-1.5 mb-3" aria-hidden>
                    {DEPT_ICONS.map(({ Icon, color, label }) => (
                      <span
                        key={label}
                        title={label}
                        className="flex items-center justify-center w-5 h-5 rounded-full shrink-0"
                        style={{ background: `color-mix(in srgb, ${color} 18%, transparent)` }}
                      >
                        <Icon size={10} style={{ color }} strokeWidth={2} />
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} weight="bold" style={{ color: PRAXIS_BLUE }} />
                    <span className="text-[13px] font-semibold" style={{ color: PRAXIS_BLUE }}>
                      Praxis AI Team
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-[var(--color-cream-mute)] font-normal">
                    Nine specialists, one subscription
                  </p>
                </th>
              </motion.tr>
            </thead>
            <tbody>
              {ROWS.map((row, index) => (
                <motion.tr
                  key={row.label}
                  className="border-b border-[var(--color-edge-subtle)]"
                  initial={reduced ? false : { opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{ duration: 0.45, ease: EASE, delay: reduced ? 0 : index * 0.07 }}
                  whileHover={reduced ? undefined : { backgroundColor: "rgba(255,255,255,0.025)" }}
                >
                  <td className="p-5 text-[13px] font-semibold text-[var(--color-cream)] align-top">
                    {row.label}
                  </td>
                  <td className="p-5 text-[14px] text-[var(--color-cream-mute)] align-top whitespace-pre-line leading-[1.6]">
                    {row.traditional}
                  </td>
                  <td
                    className="p-5 text-[14px] text-[var(--color-cream)] align-top leading-[1.6]"
                    style={{ background: "rgba(91,99,232,0.07)" }}
                  >
                    {row.countUp ? (
                      <CostCell text={row.praxis} countUp={row.countUp} active={inView} />
                    ) : (
                      <span className="whitespace-pre-line">{row.praxis}</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
