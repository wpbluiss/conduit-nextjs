"use client";

/**
 * ConfettiBurst — lightweight particle burst rendered into document.body via
 * a React portal. Fires once and auto-clears after the animation completes.
 *
 * 8 particles, accent + reward-green only, GPU-only transforms.
 * Reduced-motion: the component is never mounted (caller's responsibility).
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { CX_ACCENT, CX_REWARD } from "@/lib/design-system/cx-tokens";

const PARTICLE_DURATION = 0.52;

// Fixed spread geometry — deterministic (no Math.random) so SSR-safe.
// angle in degrees, dist in px, alternating accent / reward-green colors.
const PARTICLES: { angle: number; dist: number; color: string; size: number }[] = [
  { angle: -80, dist: 52, color: CX_ACCENT,  size: 5 },
  { angle: -30, dist: 64, color: CX_REWARD,  size: 4 },
  { angle:  20, dist: 48, color: CX_ACCENT,  size: 6 },
  { angle:  70, dist: 68, color: CX_REWARD,  size: 4 },
  { angle: 120, dist: 56, color: CX_ACCENT,  size: 5 },
  { angle: 165, dist: 60, color: CX_REWARD,  size: 6 },
  { angle:-155, dist: 44, color: CX_ACCENT,  size: 4 },
  { angle:-110, dist: 72, color: CX_REWARD,  size: 5 },
];

interface ConfettiBurstProps {
  origin: { x: number; y: number };
  onDone: () => void;
}

export function ConfettiBurst({ origin, onDone }: ConfettiBurstProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Remove burst after all particles finish + a small buffer
    const t = setTimeout(onDone, (PARTICLE_DURATION + 0.1) * 1000);
    return () => clearTimeout(t);
  }, [onDone]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[9999]">
      {PARTICLES.map((p, i) => {
        const rad = (p.angle * Math.PI) / 180;
        const dx = Math.cos(rad) * p.dist;
        const dy = Math.sin(rad) * p.dist;
        const half = p.size / 2;
        return (
          <motion.span
            key={i}
            initial={{ opacity: 1, x: origin.x - half, y: origin.y - half, scale: 1 }}
            animate={{ opacity: 0, x: origin.x + dx - half, y: origin.y + dy - half, scale: 0.3 }}
            transition={{
              duration: PARTICLE_DURATION,
              delay: i * 0.022,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: p.size,
              height: p.size,
              background: p.color,
              borderRadius: "50%",
            }}
          />
        );
      })}
    </div>,
    document.body,
  );
}
