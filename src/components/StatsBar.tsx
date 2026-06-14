"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const EASE = [0.25, 1, 0.5, 1] as const;

// PLACEHOLDER numbers — replace with real analytics when wired
const STATS = [
  { prefix: "", value: 200, suffix: "+", label: "Households managed" },
  { prefix: "$", value: 12, suffix: "M+", label: "Tracked in cash flow" },
  { prefix: "", value: 4800, suffix: "+", label: "AI conversations / week" },
  { prefix: "", value: 4, suffix: " min", label: "Avg to first insight" },
] as const;

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(target * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, target, duration]);

  return count;
}

type Stat = (typeof STATS)[number];

function StatItem({ stat, animate }: { stat: Stat; animate: boolean }) {
  const reduced = useReducedMotion();
  const shouldAnimate = animate && !reduced;
  const count = useCountUp(stat.value, shouldAnimate);
  const displayValue = shouldAnimate ? count : stat.value;

  return (
    <div className="flex flex-col items-center gap-1 px-6 py-6 text-center">
      <span
        className="text-[40px] md:text-[52px] font-bold leading-none tracking-tight conduit-ember-text"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        {stat.prefix}
        {displayValue.toLocaleString()}
        {stat.suffix}
      </span>
      <span className="conduit-caption text-[var(--color-cream-mute)] mt-1">
        {stat.label}
      </span>
    </div>
  );
}

export default function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const reduced = useReducedMotion();

  return (
    <section
      className="conduit-bg-canvas border-y border-[var(--color-edge-subtle)] py-4 md:py-2"
      aria-label="Praxis by the numbers"
    >
      <div className="conduit-container">
        <motion.div
          ref={ref}
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={inView || reduced ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE }}
          className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-[var(--color-edge-subtle)]"
        >
          {STATS.map((stat) => (
            <StatItem key={stat.label} stat={stat} animate={inView} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
