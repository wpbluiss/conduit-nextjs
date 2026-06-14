"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Illustrative placeholder stats — swap with real analytics data before launch.
// Each value is independently queryable from the Supabase analytics pipeline.
const STATS = [
  { target: 200, prefix: "", suffix: "+", label: "Businesses on Praxis" },
  { target: 50, prefix: "", suffix: "K+", label: "Tasks shipped this month" },
  { target: 12, prefix: "", suffix: "K+", label: "AI conversations / week" },
  { target: 7, prefix: "< ", suffix: " min", label: "Avg. to first deploy" },
] as const;

function CountUp({
  target,
  prefix,
  suffix,
  play,
}: {
  target: number;
  prefix: string;
  suffix: string;
  play: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!play) return;
    setCount(0);
    const duration = 1400;
    const steps = 40;
    const interval = duration / steps;
    let step = 0;
    const id = setInterval(() => {
      step++;
      // Ease-out curve: sqrt of progress
      const progress = Math.sqrt(step / steps);
      setCount(Math.round(target * Math.min(progress, 1)));
      if (step >= steps) clearInterval(id);
    }, interval);
    return () => clearInterval(id);
  }, [play, target]);

  return (
    <span>
      {prefix}
      {count}
      {suffix}
    </span>
  );
}

export default function StatsBar() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  // once: true — animation plays on first scroll-in and stays at final value.
  const inView = useInView(ref, { once: true, margin: "-5%" });
  // When reduced-motion is on, skip the count-up and show final values.
  const play = inView && !reduced;

  return (
    <section
      ref={ref}
      aria-label="Praxis at a glance"
      className="conduit-bg-canvas border-y border-[var(--color-edge-subtle)]"
    >
      <div className="conduit-container py-10 md:py-12">
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-[var(--color-edge-subtle)]">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center text-center md:px-8"
            >
              <dt className="order-2 mt-2 text-[12px] uppercase tracking-[0.08em] text-[var(--color-cream-mute)]">
                {s.label}
              </dt>
              <dd
                className="order-1 text-[40px] md:text-[48px] leading-none font-semibold tracking-[-0.03em] text-[var(--color-indigo-500)]"
                aria-live="off"
              >
                {reduced ? (
                  <span>
                    {s.prefix}
                    {s.target}
                    {s.suffix}
                  </span>
                ) : (
                  <CountUp
                    target={s.target}
                    prefix={s.prefix}
                    suffix={s.suffix}
                    play={play}
                  />
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
