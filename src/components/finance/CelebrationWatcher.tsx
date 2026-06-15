"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Confetti } from "./Confetti";
import { GradientText } from "./ui";

type Celebration = { kind: "level" | "boss"; emoji: string; title: string; subtitle: string };

export function CelebrationWatcher({ level, levelName, defeated }: { level: number; levelName: string; defeated: string[] }) {
  const [mounted, setMounted] = useState(false);
  const [queue, setQueue] = useState<Celebration[]>([]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const q: Celebration[] = [];

    // Level-up
    try {
      const raw = localStorage.getItem("cadence.level.seen");
      const seen = raw === null ? null : Number(raw);
      if (seen !== null && level > seen) {
        q.push({ kind: "level", emoji: "⭐", title: `Level ${level}`, subtitle: `You're a ${levelName} now` });
      }
      localStorage.setItem("cadence.level.seen", String(level));
    } catch {}

    // Boss defeats
    try {
      const seen: string[] = JSON.parse(localStorage.getItem("cadence.bosses.seen") || "[]");
      for (const name of defeated) {
        if (!seen.includes(name)) q.push({ kind: "boss", emoji: "💀", title: `${name} defeated`, subtitle: "One less boss between you and the goal" });
      }
      localStorage.setItem("cadence.bosses.seen", JSON.stringify(defeated));
    } catch {}

    if (q.length) setQueue(q);
  }, [mounted, level, levelName, defeated]);

  if (!mounted || queue.length === 0) return null;
  const c = queue[0];

  return createPortal(
    <AnimatePresence>
      <motion.div
        key={c.title}
        className="fin-scope fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 text-center"
        style={{ background: "rgba(7,7,8,0.92)" }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <Confetti fire />
        <motion.div
          initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
          className="text-7xl mb-4"
        >
          {c.emoji}
        </motion.div>
        <div className="fin-mono text-[11px] uppercase tracking-[0.3em] text-[var(--fin-muted)]">
          {c.kind === "level" ? "Level up" : "Boss defeated"}
        </div>
        <div className="fin-display text-4xl sm:text-5xl tracking-tight mt-1"><GradientText>{c.title}</GradientText></div>
        <p className="text-sm text-[var(--fin-muted)] mt-2 max-w-xs mx-auto">{c.subtitle}</p>
        <button
          onClick={() => setQueue((q) => q.slice(1))}
          className="fin-btn-animate mt-7 rounded-xl px-8 py-3 font-semibold"
        >
          {queue.length > 1 ? "Next" : "Let's keep going"}
        </button>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
