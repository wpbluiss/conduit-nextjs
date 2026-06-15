"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = ["#ff8a3d", "#ffa876", "#d9532a", "#34d399", "#22d3ee", "#f472b6"];

// Lightweight celebratory burst — fires once when `fire` flips true.
export function Confetti({ fire }: { fire: boolean }) {
  const [pieces, setPieces] = useState<number[]>([]);
  useEffect(() => {
    if (fire) {
      setPieces(Array.from({ length: 36 }, (_, i) => i));
      const t = setTimeout(() => setPieces([]), 1400);
      return () => clearTimeout(t);
    }
  }, [fire]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[120] overflow-hidden">
      <AnimatePresence>
        {pieces.map((i) => {
          const angle = (Math.PI * 2 * i) / pieces.length + Math.random();
          const dist = 140 + Math.random() * 220;
          return (
            <motion.span
              key={i}
              initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              animate={{
                opacity: 0,
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist + 120,
                rotate: Math.random() * 540,
                scale: 0.4,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1 + Math.random() * 0.4, ease: "easeOut" }}
              style={{
                position: "absolute",
                left: "50%",
                top: "42%",
                width: 9,
                height: 9,
                borderRadius: i % 3 === 0 ? "50%" : 2,
                background: COLORS[i % COLORS.length],
              }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
