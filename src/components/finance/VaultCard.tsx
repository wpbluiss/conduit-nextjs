"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ProgressRing } from "./ProgressRing";
import { Confetti } from "./Confetti";
import { FormModal, Field, Button } from "./forms";
import { clsx } from "./clsx";
import { fmtMoney } from "@/lib/finance/constants";
import { vaultPct, isVaultFunded } from "@/lib/finance/gamify";
import { fundVault, markVaultSpent, deleteVault } from "@/lib/finance/actions";
import type { Vault } from "@/lib/finance/types";
import { Trash, Lock, LockOpen, Sparkle } from "@phosphor-icons/react";
import { useTransition } from "react";

export function VaultCard({ v }: { v: Vault }) {
  const funded = isVaultFunded(v);
  const spent = v.status === "spent";
  const pct = vaultPct(v);
  const [fire, setFire] = useState(false);
  const wasFunded = useRef(funded);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (funded && !wasFunded.current) setFire(true);
    wasFunded.current = funded;
  }, [funded]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx("fin-card p-5 text-center", funded && !spent && "fin-glow")}
    >
      <Confetti fire={fire} />
      <div className="flex justify-between items-start">
        <span className="text-2xl">{v.emoji}</span>
        <button
          onClick={() => { if (confirm(`Delete "${v.name}"?`)) start(() => { deleteVault(v.id); }); }}
          disabled={pending}
          className="text-[var(--fin-muted)] hover:text-[#f0888c] p-1"
        >
          <Trash size={15} />
        </button>
      </div>

      <div className="flex justify-center my-2">
        <ProgressRing pct={pct} size={132} stroke={11}>
          <div className="text-xl font-bold">{Math.round(pct)}%</div>
          <div className="text-[10px] text-[var(--fin-muted)] fin-mono mt-0.5">
            {fmtMoney(Number(v.saved_amount))}
          </div>
        </ProgressRing>
      </div>

      <div className="font-semibold">{v.name}</div>
      <div className="text-[11px] text-[var(--fin-muted)]">
        {fmtMoney(Number(v.saved_amount))} of {fmtMoney(Number(v.target_amount))}
      </div>

      <div className="mt-3">
        {spent ? (
          <div className="text-[11px] fin-mono uppercase tracking-wide text-[var(--fin-muted)]">Enjoyed 🎉</div>
        ) : funded ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-[#ffa876] text-sm font-semibold">
              <LockOpen size={15} weight="fill" /> Unlocked — spend it
            </div>
            <Button variant="outline" className="w-full" disabled={pending}
              onClick={() => start(() => { markVaultSpent(v.id); })}>
              Mark spent
            </Button>
          </div>
        ) : (
          <FundVaultModal id={v.id} name={v.name} remaining={Number(v.target_amount) - Number(v.saved_amount)} />
        )}
      </div>
    </motion.div>
  );
}

function FundVaultModal({ id, name, remaining }: { id: string; name: string; remaining: number }) {
  return (
    <FormModal
      trigger={<><Lock size={15} /> Add money</>}
      triggerVariant="animate"
      triggerClassName="w-full"
      title={`Fund ${name}`}
      description={`${fmtMoney(Math.max(0, remaining))} to go until it unlocks.`}
      action={(fd) => fundVault(id, parseFloat(String(fd.get("amount")) || "0"))}
    >
      <Field label="Amount to add" name="amount" type="number" step="0.01" placeholder="0.00" required />
    </FormModal>
  );
}

export { Sparkle };
