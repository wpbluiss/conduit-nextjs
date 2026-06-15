"use client";

import { motion } from "framer-motion";
import { Lightning, Fire } from "@phosphor-icons/react";
import type { GameState } from "@/lib/finance/gamify";

export function LevelBar({ g }: { g: GameState }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="fin-card p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="grid place-items-center w-9 h-9 rounded-xl fin-btn-animate text-[var(--fin-on-accent)] font-bold text-sm">
            {g.level}
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">Level {g.level} · {g.levelName}</div>
            <div className="text-[11px] text-[var(--fin-muted)] fin-mono">{g.xp.toLocaleString()} XP</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-[#ffa876]" title="Saving streak (months)">
            <Fire size={14} weight="fill" /> {g.savingStreak}
          </span>
          <span className="flex items-center gap-1 text-[#7cc6a0]" title="On-time payment streak">
            <Lightning size={14} weight="fill" /> {g.onTimeStreak}
          </span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full fin-btn-animate"
          initial={{ width: 0 }}
          animate={{ width: `${g.levelPct}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <div className="text-[10px] text-[var(--fin-muted)] mt-1 text-right fin-mono">
        {g.xpIntoLevel}/{g.xpForNextLevel} to Level {g.level + 1}
      </div>
    </motion.div>
  );
}
