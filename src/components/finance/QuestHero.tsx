"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ProgressRing } from "./ProgressRing";
import { Confetti } from "./Confetti";
import { FormModal, Field } from "./forms";
import { GradientText } from "./ui";
import { fmtMoney } from "@/lib/finance/constants";
import { vaultPct, isVaultFunded } from "@/lib/finance/gamify";
import { mysteryHints } from "@/lib/finance/destinations";
import { fundVault } from "@/lib/finance/actions";
import type { Vault } from "@/lib/finance/types";

export function QuestHero({ vault, autofundPct }: { vault: Vault | null; autofundPct: number }) {
  const funded = vault ? isVaultFunded(vault) : false;
  const [fire, setFire] = useState(false);
  const was = useRef(funded);
  useEffect(() => {
    if (funded && !was.current) setFire(true);
    was.current = funded;
  }, [funded]);

  if (!vault) {
    return (
      <Link href="/finance/rewards" className="block">
        <div className="fin-card fin-glow p-6 text-center hover:bg-white/[0.03] transition">
          <div className="text-4xl">🎁</div>
          <div className="fin-display text-2xl mt-2">Start a <GradientText>reward</GradientText></div>
          <p className="text-sm text-[var(--fin-muted)] mt-1">A trip, a treat, a surprise — save up and unlock it guilt-free.</p>
        </div>
      </Link>
    );
  }

  const mysteryHidden = vault.is_mystery && !vault.revealed;
  const pct = vaultPct(vault);
  const emoji = mysteryHidden ? "🎁" : vault.emoji;
  const name = mysteryHidden ? "Mystery Trip" : vault.name;
  const remaining = Number(vault.target_amount) - Number(vault.saved_amount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fin-card fin-glow p-6 sm:p-8 text-center relative overflow-hidden"
    >
      <Confetti fire={fire} />
      <div className="fin-mono text-[10px] uppercase tracking-[0.28em] text-[var(--fin-muted)]">
        {funded ? "Unlocked — go enjoy it" : "Chasing"}
      </div>

      <div className="flex justify-center mt-4">
        <ProgressRing pct={pct} size={210} stroke={14}>
          <motion.div
            className="text-5xl"
            animate={mysteryHidden ? { rotate: [0, -6, 6, 0] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
          >
            {emoji}
          </motion.div>
          <div className="text-xs text-[var(--fin-muted)] fin-mono mt-1">{Math.round(pct)}%</div>
        </ProgressRing>
      </div>

      <div className="fin-display text-2xl sm:text-3xl mt-4"><GradientText>{name}</GradientText></div>
      <div className="text-sm text-[var(--fin-muted)] mt-1">
        {fmtMoney(Number(vault.saved_amount))} of {fmtMoney(Number(vault.target_amount))}
        {!funded && remaining > 0 && <> · {fmtMoney(remaining)} to unlock</>}
      </div>
      {mysteryHidden && (() => {
        const hints = mysteryHints(Number(vault.target_amount));
        const unlocked = Math.min(hints.length, Math.floor(pct / 25) + 1);
        return (
          <div className="mt-2">
            <div className="text-[12px] text-[#ffa876]">🌍 destination revealed at 100%</div>
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              {hints.map((h, i) => (
                <span key={i} className={`text-[11px] rounded-full border px-2.5 py-1 ${i < unlocked ? "border-[#ff8a3d]/30 text-[#ffa876]" : "border-white/10 text-white/25"}`}>
                  {i < unlocked ? h : "🔒 hint"}
                </span>
              ))}
            </div>
            <div className="text-[10px] text-[var(--fin-muted)] mt-1 fin-mono">{unlocked}/{hints.length} clues · more unlock as you save</div>
          </div>
        );
      })()}
      {vault.is_mystery && vault.revealed && vault.mystery_blurb && (
        <div className="text-[12px] text-[var(--fin-muted)] italic mt-1">✨ {vault.mystery_blurb}</div>
      )}

      <div className="mt-5 max-w-xs mx-auto">
        {funded ? (
          <Link href="/finance/rewards" className="inline-block rounded-xl border border-white/15 px-5 py-2.5 text-sm hover:bg-white/5 transition">
            See your reward →
          </Link>
        ) : (
          <FormModal
            trigger="🎁 Add to it"
            triggerVariant="animate"
            triggerClassName="w-full"
            title={`Fund ${name}`}
            description={`${fmtMoney(Math.max(0, remaining))} to go until it unlocks.`}
            action={(fd) => fundVault(vault.id, parseFloat(String(fd.get("amount")) || "0"))}
          >
            <Field label="Amount to add" name="amount" type="number" step="0.01" placeholder="0.00" required />
          </FormModal>
        )}
        {autofundPct > 0 && !funded && (
          <div className="text-[11px] text-[var(--fin-muted)] mt-2 fin-mono">
            auto-stashing {Math.round(autofundPct * 100)}% of every paycheck
          </div>
        )}
      </div>
    </motion.div>
  );
}
