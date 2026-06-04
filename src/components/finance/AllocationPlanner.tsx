"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { planAllocation } from "@/lib/finance/compute";
import type { Snapshot } from "@/lib/finance/types";
import { fmtMoney } from "@/lib/finance/constants";
import { AddSavingsModal } from "./QuickAdd";

const PRESETS = [50, 150, 500, 1000];

const bucketStyle: Record<string, { label: string; bar: string; text: string }> = {
  expenses: { label: "Due bills", bar: "linear-gradient(90deg,#FBBF24,#F59E0B)", text: "text-amber-300" },
  savings: { label: "Down-payment goal", bar: "linear-gradient(90deg,#7C5CFF,#22D3EE,#34D399)", text: "text-violet-300" },
  debt: { label: "Debt-killer", bar: "linear-gradient(90deg,#F472B6,#FBBF24)", text: "text-pink-300" },
};

export function AllocationPlanner({ snap }: { snap: Snapshot }) {
  const [amount, setAmount] = useState<number>(0);
  const plan = amount > 0 ? planAllocation(amount, snap) : null;

  return (
    <div className="fin-card p-5 sm:p-6">
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--fin-muted)] fin-mono mb-1">
            Allocation engine
          </div>
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight">Got money in? Here&apos;s the split.</h2>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[140px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fin-muted)]">$</span>
          <input
            type="number"
            inputMode="decimal"
            value={amount || ""}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            placeholder="Enter an amount"
            className="w-full rounded-lg bg-white/5 border border-white/10 pl-7 pr-3 py-2.5 text-sm outline-none focus:border-violet-400/50 transition placeholder:text-white/25"
          />
        </div>
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setAmount(p)}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[var(--fin-muted)] hover:text-white hover:bg-white/5 transition"
          >
            ${p}
          </button>
        ))}
      </div>

      {!plan ? (
        <p className="text-sm text-[var(--fin-muted)]">
          Enter a paycheck or windfall amount and I&apos;ll show exactly where each dollar should go —
          due bills first, then the goal, then the debt-killer (and once debt is $0, it all rolls into the goal).
        </p>
      ) : (
        <div className="space-y-3">
          {plan.lines.map((line, i) => {
            const style = bucketStyle[line.bucket];
            const pct = (line.amount / amount) * 100;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className={style.text}>{line.label}</span>
                  <span className="font-semibold">{fmtMoney(line.amount)}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: style.bar }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <div className="text-[11px] text-[var(--fin-muted)] mt-1">{line.detail}</div>
              </motion.div>
            );
          })}

          {plan.leftover > 0 && (
            <div className="text-xs text-[var(--fin-muted)]">
              Leftover buffer: {fmtMoney(plan.leftover)}
            </div>
          )}

          <div className="pt-2 flex flex-wrap gap-2">
            <AddSavingsModal />
            <span className="text-[11px] text-[var(--fin-muted)] self-center">
              Tip: the Advisor can log the whole split in one message.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
