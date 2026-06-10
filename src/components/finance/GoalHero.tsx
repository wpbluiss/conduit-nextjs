"use client";

import { motion } from "framer-motion";
import { ProgressRing } from "./ProgressRing";
import { AnimatedNumber } from "./AnimatedNumber";
import { GradientText } from "./ui";
import { AddSavingsModal } from "./QuickAdd";
import type { GoalProgress } from "@/lib/finance/compute";
import { fmtMoney } from "@/lib/finance/constants";

export function GoalHero({ g }: { g: GoalProgress }) {
  const ahead = g.aheadBehindDollars >= 0;
  const daysOff =
    g.dailyRateNeeded > 0
      ? Math.round(Math.abs(g.aheadBehindDollars) / g.dailyRateNeeded)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fin-card fin-glow p-6 sm:p-8"
    >
      <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
        <div className="shrink-0">
          <ProgressRing pct={g.pct} size={260} stroke={16}>
            <div className="fin-mono text-[10px] uppercase tracking-[0.28em] text-[var(--fin-muted)]">
              Down payment
            </div>
            <div className="mt-1 text-4xl sm:text-5xl font-semibold">
              <GradientText>
                <AnimatedNumber value={g.saved} prefix="$" />
              </GradientText>
            </div>
            <div className="text-xs text-[var(--fin-muted)] mt-1">
              of {fmtMoney(g.goal)} · <AnimatedNumber value={g.pct} decimals={1} suffix="%" />
            </div>
          </ProgressRing>
        </div>

        <div className="flex-1 w-full">
          <div className="fin-mono text-[11px] uppercase tracking-[0.24em] text-[var(--fin-muted)]">
            The Goal
          </div>
          <h1 className="fin-display text-3xl sm:text-4xl tracking-tight mt-1">
            A home for the family
          </h1>
          <p className="text-sm text-[var(--fin-muted)] mt-2 max-w-md">
            ~$750K multi-tenant property · {fmtMoney(g.goal)} down · ~15 months.
            This is the engine. Everything points here.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <div className="fin-mono text-[10px] uppercase tracking-[0.18em] text-[var(--fin-muted)]">
                Status
              </div>
              <div
                className={`text-lg font-semibold mt-1 ${ahead ? "text-[#7cc6a0]" : "text-[#ffa876]"}`}
              >
                {ahead ? "Ahead" : "Behind"} by {fmtMoney(Math.abs(g.aheadBehindDollars))}
              </div>
              <div className="text-xs text-[var(--fin-muted)]">
                ≈ {daysOff} days {ahead ? "ahead of" : "behind"} pace
              </div>
            </div>
            <div>
              <div className="fin-mono text-[10px] uppercase tracking-[0.18em] text-[var(--fin-muted)]">
                Projected finish
              </div>
              <div className="text-lg font-semibold mt-1">
                {g.projectedCompletion
                  ? new Date(g.projectedCompletion).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })
                  : "—"}
              </div>
              <div className="text-xs text-[var(--fin-muted)]">
                Pace needed: {fmtMoney(g.monthlyPaceNeeded)}/mo
              </div>
            </div>
          </div>

          {/* target vs actual bar */}
          <div className="mt-6">
            <div className="flex justify-between text-[11px] text-[var(--fin-muted)] mb-1.5 fin-mono">
              <span>Target-by-today {fmtMoney(g.expectedByNow)}</span>
              <span>{fmtMoney(g.saved)} actual</span>
            </div>
            <div className="relative h-2.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-white/15"
                style={{ width: `${Math.min(100, (g.expectedByNow / g.goal) * 100)}%` }}
              />
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: "linear-gradient(90deg,#d9532a,#ff8a3d,#ffa876)",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, g.pct)}%` }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>

          <div className="mt-6">
            <AddSavingsModal />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
