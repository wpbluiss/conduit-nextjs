"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "./AnimatedNumber";
import { clsx } from "./clsx";

export function MetricCard({
  label,
  value,
  prefix = "$",
  suffix = "",
  decimals = 0,
  hint,
  tone = "default",
  delay = 0,
  glow = false,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  hint?: string;
  tone?: "default" | "violet" | "cyan" | "green" | "pink" | "amber";
  delay?: number;
  glow?: boolean;
}) {
  const tones: Record<string, string> = {
    default: "text-white",
    violet: "text-[#ffa876]",
    cyan: "text-[#ffa876]",
    green: "text-[#7cc6a0]",
    pink: "text-[#ffa876]",
    amber: "text-[#ffa876]",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={clsx("fin-card p-5", glow && "fin-glow")}
    >
      <div className="fin-mono text-[10px] uppercase tracking-[0.18em] text-[var(--fin-muted)]">
        {label}
      </div>
      <div className={clsx("text-2xl sm:text-[28px] font-semibold mt-2", tones[tone])}>
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </div>
      {hint && <div className="text-xs text-[var(--fin-muted)] mt-1">{hint}</div>}
    </motion.div>
  );
}
