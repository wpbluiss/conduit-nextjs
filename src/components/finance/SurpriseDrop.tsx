"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Confetti } from "./Confetti";
import { fmtMoney } from "@/lib/finance/constants";

function isoWeek(): string {
  const d = new Date();
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

// Honest "surprise": when you're genuinely ahead of pace, Cadence gives you
// PERMISSION to enjoy a slice of the surplus guilt-free. It never invents money.
export function SurpriseDrop({ aheadDollars }: { aheadDollars: number }) {
  const treat = aheadDollars > 100 ? Math.min(75, Math.max(10, Math.round(aheadDollars * 0.1))) : 0;
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (treat <= 0) return;
    try {
      if (localStorage.getItem("cadence.surprise.week") === isoWeek()) return;
    } catch {}
    setShow(true);
    try { navigator.vibrate?.([18, 40, 18]); } catch {}
  }, [treat]);

  function dismiss() {
    setShow(false);
    try { localStorage.setItem("cadence.surprise.week", isoWeek()); } catch {}
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="fin-card fin-glow p-5 relative overflow-hidden"
        >
          <Confetti fire={show} />
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-2xl">🎉</div>
              <div className="font-semibold mt-1">Surprise — you&apos;re ahead!</div>
              <p className="text-sm text-[var(--fin-muted)] mt-1 max-w-xs">
                You&apos;re {fmtMoney(aheadDollars)} ahead of pace. Blow{" "}
                <span className="text-[#ffa876] font-semibold">{fmtMoney(treat)}</span> on yourselves this week — guilt-free, it&apos;s earned.
              </p>
            </div>
          </div>
          <button onClick={dismiss} className="fin-btn-animate mt-4 rounded-lg px-5 py-2 text-sm font-medium">
            Treat claimed 😎
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
