"use client";

import { motion } from "framer-motion";
import { PencilSimple } from "@phosphor-icons/react";
import { AnimatedNumber } from "./AnimatedNumber";
import { FormModal, Field } from "./forms";
import { updateExpectedDeposit } from "@/lib/finance/actions";
import { fmtMoney } from "@/lib/finance/constants";

export function MoneyStrip({
  pooled,
  expected,
  expectedDate,
  expectedNote,
  aheadBehind,
  onTrack,
}: {
  pooled: number;
  expected: number;
  expectedDate: string | null;
  expectedNote: string | null;
  aheadBehind: number;
  onTrack: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid grid-cols-2 gap-3"
    >
      <div className="fin-card p-4">
        <div className="fin-mono text-[10px] uppercase tracking-[0.18em] text-[var(--fin-muted)]">
          Pooled cash
        </div>
        <div className={`text-2xl sm:text-3xl font-semibold mt-1 ${pooled < 0 ? "text-[#f0888c]" : "text-[#ffa876]"}`}>
          <AnimatedNumber value={pooled} prefix="$" decimals={pooled % 1 !== 0 ? 2 : 0} />
        </div>
        <div className="text-[11px] text-[var(--fin-muted)] mt-1">
          {onTrack ? "Ahead of" : "Behind"} goal pace by {fmtMoney(Math.abs(aheadBehind))}
        </div>
      </div>

      <div className="fin-card p-4 relative">
        <div className="flex items-center justify-between">
          <div className="fin-mono text-[10px] uppercase tracking-[0.18em] text-[var(--fin-muted)]">
            Incoming (est.)
          </div>
          <FormModal
            trigger={<PencilSimple size={13} />}
            triggerVariant="ghost"
            title="Expected next deposit"
            description="Your best estimate — update it the second the real check lands."
            action={updateExpectedDeposit}
          >
            <Field label="Amount" name="expected_next_deposit" type="number" step="0.01" defaultValue={expected} required />
            <Field label="Expected date" name="expected_deposit_date" type="date" defaultValue={expectedDate ?? ""} />
            <Field label="Note" name="expected_deposit_note" defaultValue={expectedNote ?? ""} />
          </FormModal>
        </div>
        <div className="text-2xl sm:text-3xl font-semibold mt-1 text-[#7cc6a0]">
          <AnimatedNumber value={expected} prefix="$" />
        </div>
        <div className="text-[11px] text-[var(--fin-muted)] mt-1">
          {expectedDate
            ? new Date(expectedDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
            : "set a date"}
        </div>
      </div>
    </motion.div>
  );
}
