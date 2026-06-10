"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ProgressRing } from "./ProgressRing";
import { GradientText } from "./ui";
import { fmtMoney } from "@/lib/finance/constants";

export function CompactGoalDebt({
  saved,
  goal,
  goalPct,
  projectedCompletion,
  debtLeft,
  debtPaid,
  debtOriginal,
  attackNext,
}: {
  saved: number;
  goal: number;
  goalPct: number;
  projectedCompletion: string | null;
  debtLeft: number;
  debtPaid: number;
  debtOriginal: number;
  attackNext: string | null;
}) {
  const debtPct = debtOriginal > 0 ? (debtPaid / debtOriginal) * 100 : 0;
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <Link href="/finance/settings" className="fin-card fin-glow p-4 flex items-center gap-4 hover:bg-white/[0.03] transition">
        <ProgressRing pct={goalPct} size={92} stroke={9}>
          <div className="text-base font-semibold">
            <GradientText>{goalPct.toFixed(0)}%</GradientText>
          </div>
        </ProgressRing>
        <div className="min-w-0">
          <div className="fin-mono text-[10px] uppercase tracking-[0.18em] text-[var(--fin-muted)]">Down-payment goal</div>
          <div className="text-xl font-semibold mt-0.5">{fmtMoney(saved)}</div>
          <div className="text-[11px] text-[var(--fin-muted)]">of {fmtMoney(goal)}</div>
          {projectedCompletion && (
            <div className="text-[11px] text-[var(--fin-muted)] mt-1">
              ETA {new Date(projectedCompletion).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
            </div>
          )}
        </div>
      </Link>

      <Link href="/finance/debts" className="fin-card p-4 flex flex-col justify-center hover:bg-white/[0.03] transition">
        <div className="flex items-center justify-between">
          <div className="fin-mono text-[10px] uppercase tracking-[0.18em] text-[var(--fin-muted)]">Debt-Killer</div>
          <span className="text-[11px] text-pink-300">{fmtMoney(debtLeft)} left</span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden mt-2">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg,#F472B6,#FBBF24)" }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(100, debtPct))}%` }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="text-[11px] text-[var(--fin-muted)] mt-2">
          {attackNext ? <>Attack next: <span className="text-white">{attackNext}</span></> : "🎉 Debt-free"}
        </div>
      </Link>
    </div>
  );
}
