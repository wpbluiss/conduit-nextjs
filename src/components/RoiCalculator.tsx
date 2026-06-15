"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const EASE = [0.25, 1, 0.5, 1] as const;

// Per-specialist annual total employment cost (base salary + ~30% benefits + recruiting).
// Source ranges: BLS Occupational Employment Statistics 2024, Glassdoor national US medians.
// These are conservative estimates for a growth-stage company.
const SPECIALIST_COSTS_BASE = [
  130_000, // Marketing Manager: $85k base + overhead
  130_000, // Sales Executive: $90k base + overhead  (OTE + benefits)
  170_000, // Software Engineer (mid-level): $130k base + overhead
  150_000, // Legal Counsel (in-house): $115k base + overhead
  120_000, // Finance / Ops Manager: $90k base + overhead
  100_000, // HR Manager: $75k base + overhead
  105_000, // Operations Manager: $80k base + overhead
  160_000, // Product Manager: $120k base + overhead
  120_000, // Growth / Performance Marketing: $90k base + overhead
];

type Stage = "early" | "growth" | "scale";

const STAGE_CONFIG: Record<Stage, { label: string; multiplier: number; note: string }> = {
  early: {
    label: "Early",
    multiplier: 0.82,
    note: "Lean salaries, seed-stage equity substitution",
  },
  growth: {
    label: "Growth",
    multiplier: 1.0,
    note: "Market rates, full health/dental/401k",
  },
  scale: {
    label: "Scale",
    multiplier: 1.25,
    note: "Above-market, premium recruiting overhead",
  },
};

// Praxis Enterprise plan — covers all 9 specialists.
const PRAXIS_ANNUAL = 199 * 12; // $2,388/yr

function computeHireCost(specialists: number, stage: Stage): number {
  const m = STAGE_CONFIG[stage].multiplier;
  return Math.round(
    SPECIALIST_COSTS_BASE.slice(0, specialists).reduce((s, c) => s + c * m, 0),
  );
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n}`;
}

function useCountUp(target: number, reduced: boolean): number {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) {
      setDisplay(target);
      fromRef.current = target;
      return;
    }
    const from = fromRef.current;
    fromRef.current = target;
    if (from === target) return;

    const duration = 450;
    const start = performance.now();

    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, reduced]);

  return display;
}

export default function RoiCalculator() {
  const reduced = useReducedMotion();
  const [specialists, setSpecialists] = useState(3);
  const [stage, setStage] = useState<Stage>("growth");

  const hireCost = computeHireCost(specialists, stage);
  const savings = hireCost - PRAXIS_ANNUAL;
  const pct = Math.round((savings / hireCost) * 100);

  const animHire = useCountUp(hireCost, reduced);
  const animSavings = useCountUp(savings, reduced);

  const onSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSpecialists(Number(e.target.value));
  }, []);

  return (
    <section
      id="roi-calculator"
      className="relative conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)] overflow-hidden"
    >
      {/* Ambient gradient */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 100%, rgba(91,99,232,0.05) 0%, transparent 65%)",
        }}
      />

      <div className="conduit-container relative z-10">
        {/* Header */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8%" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center mb-12"
        >
          <p className="conduit-caption conduit-caption-indigo mb-4">
            ROI Calculator
          </p>
          <h2 className="conduit-display-xl max-w-xl mx-auto mb-5">
            The math is simple.
          </h2>
          <p
            className="conduit-body-lg max-w-md mx-auto"
            style={{ color: "var(--color-ink-secondary)" }}
          >
            See how much you save running Praxis instead of hiring a team.
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8%" }}
          transition={{ duration: 0.55, delay: 0.1, ease: EASE }}
          className="max-w-lg mx-auto mb-12 space-y-7"
        >
          {/* Specialist count slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label
                htmlFor="roi-specialists"
                className="text-sm font-semibold"
                style={{ color: "var(--color-ink-primary)" }}
              >
                Specialists you need
              </label>
              <span
                className="text-sm font-bold tabular-nums px-2.5 py-0.5 rounded-full"
                style={{
                  background: "var(--color-accent)",
                  color: "#fff",
                }}
              >
                {specialists} of 9
              </span>
            </div>

            <div className="relative">
              <input
                id="roi-specialists"
                type="range"
                min={1}
                max={9}
                step={1}
                value={specialists}
                onChange={onSlider}
                className="roi-range w-full"
                aria-valuetext={`${specialists} specialist${specialists > 1 ? "s" : ""}`}
              />
              {/* Tick marks */}
              <div className="flex justify-between mt-1.5 px-[2px]">
                {Array.from({ length: 9 }, (_, i) => (
                  <span
                    key={i}
                    className="text-[10px] tabular-nums"
                    style={{ color: i + 1 === specialists ? "var(--color-accent)" : "var(--color-ink-tertiary)" }}
                  >
                    {i + 1}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Stage selector */}
          <div>
            <span
              className="text-sm font-semibold block mb-3"
              style={{ color: "var(--color-ink-primary)" }}
            >
              Company stage
            </span>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Company stage">
              {(["early", "growth", "scale"] as Stage[]).map((s) => {
                const active = s === stage;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStage(s)}
                    aria-pressed={active}
                    className="py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                    style={{
                      background: active ? "var(--color-accent)" : "var(--color-ink-surface)",
                      color: active ? "#fff" : "var(--color-ink-secondary)",
                      border: `1.5px solid ${active ? "var(--color-accent)" : "var(--color-edge-subtle)"}`,
                      boxShadow: active ? "0 2px 8px rgba(255,138,61,0.25)" : "none",
                    }}
                  >
                    {STAGE_CONFIG[s].label}
                  </button>
                );
              })}
            </div>
            <p
              className="text-[11px] mt-2 text-center"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              {STAGE_CONFIG[stage].note}
            </p>
          </div>
        </motion.div>

        {/* Output cards */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8%" }}
          transition={{ duration: 0.55, delay: 0.2, ease: EASE }}
          className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10"
        >
          {/* Annual hiring cost */}
          <div
            className="rounded-2xl p-6 text-center"
            style={{
              background: "var(--color-ink-surface)",
              border: "1.5px solid var(--color-edge-subtle)",
            }}
          >
            <p
              className="text-[11px] uppercase tracking-[0.1em] font-semibold mb-2"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              Annual hiring cost
            </p>
            <p
              className="text-3xl font-bold tabular-nums leading-none mb-2"
              style={{ color: "var(--color-ink-primary)" }}
              aria-live="polite"
              aria-label={`Annual hiring cost: ${fmt(animHire)}`}
            >
              {fmt(animHire)}
            </p>
            <p
              className="text-[11px] leading-relaxed"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              salary + benefits + recruiting
            </p>
          </div>

          {/* Savings — hero card */}
          <div
            className="rounded-2xl p-6 text-center relative sm:-mt-2 sm:-mb-2"
            style={{
              background: "var(--color-accent)",
              boxShadow: "0 4px 24px rgba(255,138,61,0.30), 0 1px 3px rgba(255,138,61,0.15)",
            }}
          >
            <p className="text-[11px] uppercase tracking-[0.1em] font-semibold text-white/70 mb-2">
              You save
            </p>
            <p
              className="text-4xl font-bold tabular-nums leading-none mb-2 text-white"
              aria-live="polite"
              aria-label={`You save ${fmt(animSavings)}`}
            >
              {fmt(animSavings)}
            </p>
            <span
              className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: "rgba(255,255,255,0.22)", color: "#fff" }}
            >
              {pct}% less than hiring
            </span>
          </div>

          {/* Praxis cost */}
          <div
            className="rounded-2xl p-6 text-center"
            style={{
              background: "var(--color-ink-surface)",
              border: "1.5px solid var(--color-edge-subtle)",
            }}
          >
            <p
              className="text-[11px] uppercase tracking-[0.1em] font-semibold mb-2"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              Annual Praxis cost
            </p>
            <p
              className="text-3xl font-bold tabular-nums leading-none mb-2"
              style={{ color: "var(--color-ink-primary)" }}
            >
              {fmt(PRAXIS_ANNUAL)}
            </p>
            <p
              className="text-[11px] leading-relaxed"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              Enterprise plan · all 9 specialists
            </p>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8%" }}
          transition={{ duration: 0.4, delay: 0.3, ease: EASE }}
          className="text-center"
        >
          <Link
            href="/auth/sign-up"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            style={{ background: "var(--color-accent)", color: "#fff" }}
          >
            Save {fmt(savings)} this year
            <ArrowRight size={16} weight="bold" />
          </Link>
          <p
            className="text-[11px] mt-4 max-w-xs mx-auto leading-relaxed"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            Estimates based on BLS Occupational Employment Statistics 2024 + Glassdoor
            US national medians. Individual costs will vary.
          </p>
        </motion.div>
      </div>

      {/* Slider styles */}
      <style>{`
        .roi-range {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          background: var(--color-edge-subtle);
          border-radius: 2px;
          outline: none;
          cursor: pointer;
        }
        .roi-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--color-accent);
          cursor: pointer;
          border: 3px solid #fff;
          box-shadow: 0 0 0 1.5px var(--color-accent), 0 2px 8px rgba(255,138,61,0.3);
          transition: box-shadow 0.15s;
        }
        .roi-range::-webkit-slider-thumb:hover {
          box-shadow: 0 0 0 3px rgba(255,138,61,0.25), 0 2px 10px rgba(255,138,61,0.35);
        }
        .roi-range::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--color-accent);
          cursor: pointer;
          border: 3px solid #fff;
          box-shadow: 0 0 0 1.5px var(--color-accent);
        }
        .roi-range:focus-visible::-webkit-slider-thumb {
          box-shadow: 0 0 0 4px rgba(255,138,61,0.35);
        }
      `}</style>
    </section>
  );
}
