"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const EASE = [0.25, 1, 0.5, 1] as const;

// Illustrative placeholders — replace with real telemetry once available.
const STATS = [
  { value: 9,    suffix: "",    label: "specialists on every team",      note: "nine" },
  { value: 500,  suffix: "+",   label: "businesses running Praxis",      note: "illustrative" },
  { value: 10,   suffix: "×",   label: "faster than traditional hiring", note: "illustrative" },
  { value: 24,   suffix: "/7",  label: "always on — no sick days",       note: "always-on" },
] as const;

function useCountUp(target: number, active: boolean, reduced: boolean) {
  const [count, setCount] = useState(reduced ? target : 0);
  const frame = useRef<ReturnType<typeof requestAnimationFrame>>(undefined);

  useEffect(() => {
    if (!active || reduced) {
      setCount(target);
      return;
    }
    const duration = 1200;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const pct = Math.min(elapsed / duration, 1);
      // Ease-out quint
      const eased = 1 - Math.pow(1 - pct, 5);
      setCount(Math.round(eased * target));
      if (pct < 1) frame.current = requestAnimationFrame(tick);
    }

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    };
  }, [active, target, reduced]);

  return count;
}

function StatItem({
  value,
  suffix,
  label,
  active,
  reduced,
  index,
}: {
  value: number;
  suffix: string;
  label: string;
  active: boolean;
  reduced: boolean;
  index: number;
}) {
  const count = useCountUp(value, active, reduced);

  return (
    <motion.div
      initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8%" }}
      transition={{ duration: reduced ? 0 : 0.65, delay: reduced ? 0 : index * 0.12, ease: EASE }}
      className="flex flex-col items-center text-center px-4 py-5 sm:py-0"
    >
      <span
        className="text-4xl sm:text-5xl font-bold tabular-nums leading-none tracking-tight"
        style={{ color: "var(--color-ember-500, #FF8A3D)" }}
        aria-label={`${value}${suffix}`}
      >
        {count}
        {suffix}
      </span>
      <span
        className="mt-2 text-[13px] leading-snug max-w-[130px] sm:max-w-[150px]"
        style={{ color: "var(--color-ink-soft, rgba(255,255,255,0.55))" }}
      >
        {label}
      </span>
    </motion.div>
  );
}

export default function StatsBar() {
  const reduced = useReducedMotion();
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (reduced) { setInView(true); return; }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [reduced]);

  return (
    <motion.section
      ref={ref}
      aria-label="Praxis by the numbers"
      initial={{ opacity: reduced ? 1 : 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: reduced ? 0 : 0.5, ease: EASE }}
      className="relative border-y border-[var(--color-edge-subtle,rgba(255,255,255,0.06))]"
      style={{ background: "var(--color-surface-tinted,rgba(255,138,61,0.03))" }}
    >
      <div className="conduit-container py-10 sm:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-8 sm:gap-y-0 sm:divide-x sm:divide-[var(--color-edge-subtle,rgba(255,255,255,0.06))]">
          {STATS.map((stat, i) => (
            <StatItem
              key={stat.label}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              active={inView}
              reduced={reduced}
              index={i}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}
