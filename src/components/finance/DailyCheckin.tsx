"use client";

import { useState, useTransition } from "react";
import { Fire } from "@phosphor-icons/react";
import { dailyCheckin } from "@/lib/finance/actions";

export function DailyCheckin({ streak, doneToday }: { streak: number; doneToday: boolean }) {
  const [done, setDone] = useState(doneToday);
  const [count, setCount] = useState(streak);
  const [pending, start] = useTransition();

  function check() {
    start(async () => {
      const res = await dailyCheckin();
      if (res.ok) {
        setDone(true);
        if (res.streak) setCount(res.streak);
        try { navigator.vibrate?.(30); } catch {}
      }
    });
  }

  return (
    <div className="fin-card p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="grid place-items-center w-10 h-10 rounded-xl bg-[#ff8a3d]/15">
          <Fire size={20} weight="fill" className="text-[#ffa876]" />
        </div>
        <div>
          <div className="text-sm font-semibold">{count}-day streak</div>
          <div className="text-[11px] text-[var(--fin-muted)]">{done ? "Checked in today ✓" : "Keep the flame alive"}</div>
        </div>
      </div>
      <button
        onClick={check}
        disabled={pending || done}
        className={done
          ? "rounded-lg border border-white/10 px-4 py-2 text-xs text-[var(--fin-muted)]"
          : "fin-btn-animate rounded-lg px-4 py-2 text-sm font-medium"}
      >
        {done ? "Done" : pending ? "…" : "Check in +5 XP"}
      </button>
    </div>
  );
}
