"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Confetti } from "./Confetti";
import { GradientText } from "./ui";
import { SPIN_NAMES } from "@/lib/finance/destinations";

type RV = { id: string; destination: string; blurb: string | null; emoji: string };

const SEEN_KEY = "cadence.reveal.seen";

export function MysteryReveal({ vaults }: { vaults: RV[] }) {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState<RV | null>(null);
  const [display, setDisplay] = useState("");
  const [landed, setLanded] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    let seen: string[] = [];
    try { seen = JSON.parse(localStorage.getItem(SEEN_KEY) || "[]"); } catch {}
    const fresh = vaults.find((v) => v.destination && !seen.includes(v.id));
    if (fresh) setActive(fresh);
  }, [mounted, vaults]);

  useEffect(() => {
    if (!active) return;
    setLanded(false);
    let i = 0;
    const spin = setInterval(() => {
      setDisplay(SPIN_NAMES[i % SPIN_NAMES.length]);
      i++;
    }, 95);
    const stop = setTimeout(() => {
      clearInterval(spin);
      setDisplay(active.destination);
      setLanded(true);
      try {
        const seen = JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
        localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, active.id]));
      } catch {}
    }, 1700);
    return () => { clearInterval(spin); clearTimeout(stop); };
  }, [active]);

  if (!mounted || !active) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fin-scope fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 text-center"
        style={{ background: "rgba(7,7,8,0.92)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Confetti fire={landed} />
        <div className="fin-mono text-[11px] uppercase tracking-[0.3em] text-[var(--fin-muted)]">
          {landed ? "You're going to" : "Choosing your surprise…"}
        </div>

        <motion.div
          key={display}
          initial={{ opacity: 0, y: landed ? 0 : 8, scale: landed ? 0.9 : 1 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: landed ? 0.5 : 0.08 }}
          className="my-4"
        >
          <div className="text-6xl mb-3">{landed ? active.emoji : "🎁"}</div>
          <div className="fin-display text-3xl sm:text-5xl tracking-tight">
            {landed ? <GradientText>{display}</GradientText> : <span className="text-white/80">{display}</span>}
          </div>
        </motion.div>

        {landed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            {active.blurb && <p className="text-sm text-[var(--fin-muted)] max-w-xs mx-auto">{active.blurb}</p>}
            <p className="text-[#ffa876] mt-3 font-semibold">It&apos;s funded. Go — guilt-free. ✈️</p>
            <button
              onClick={() => setActive(null)}
              className="fin-btn-animate mt-6 rounded-xl px-8 py-3 font-semibold"
            >
              Let&apos;s go
            </button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
