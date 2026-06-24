"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CX_REWARD, CX_ACCENT, CX_ACCENT_BRIGHT } from "@/lib/design-system/cx-tokens";

// 5 evenly-spaced angles for the spark burst (significant completions only)
// Spec: "4-6 particles, 300ms" — 5 hits the sweet spot of tasteful without feeling sparse.
const SPARK_COUNT = 5;
const SPARK_ANGLES_DEG = Array.from({ length: SPARK_COUNT }, (_, i) => (360 / SPARK_COUNT) * i);
const SPARK_COLORS = SPARK_ANGLES_DEG.map((_, i) =>
  i % 3 === 0 ? CX_ACCENT_BRIGHT : i % 3 === 1 ? CX_REWARD : CX_ACCENT,
);

/**
 * RewardBurst — celebratory beat played once when a specialist completes a turn.
 *
 * Renders as an absolutely-positioned overlay; place inside a `position: relative`
 * parent (e.g. the specialist avatar container).
 *
 * Full-motion path (default):
 *   - Expanding accent→green glow ring (520ms, ease [0.22,1,0.36,1]) — on every completion
 *   - 10 GPU-cheap spark particles that burst outward (400ms, staggered 15ms) — significant only
 *
 * Reduced-motion path (`prefers-reduced-motion: reduce`):
 *   - Simple green opacity flash (250ms) — no scale, no particles
 *
 * "Significant" = the specialist response is substantive (> 300 chars).
 * All completions get the ring pulse; sparks are the bonus for notable responses.
 */
export function RewardBurst({
  rewarded,
  significant = false,
  size = 32,
}: {
  rewarded: boolean;
  /** When true, fire the radial spark burst in addition to the ring pulse. */
  significant?: boolean;
  /** Parent avatar size in px — used to scale the spark burst radius. */
  size?: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  const sparkRadius = Math.round(size * 0.9);
  const radius = Math.round(size * 0.25);

  if (prefersReducedMotion) {
    return (
      <AnimatePresence>
        {rewarded && (
          <motion.span
            key="reward-flash"
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0.45 }}
            animate={{ opacity: 0 }}
            exit={{}}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{
              borderRadius: radius,
              background: CX_REWARD,
            }}
          />
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {rewarded && (
        <>
          {/* Expanding accent→green glow ring — fires on every completion */}
          <motion.span
            key="reward-ring"
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            initial={{
              opacity: 0.9,
              scale: 0.85,
              boxShadow: `0 0 0 2px ${CX_ACCENT}, 0 0 10px 3px ${CX_ACCENT}55`,
            }}
            animate={{
              opacity: 0,
              scale: 2.2,
              boxShadow: `0 0 0 2px ${CX_REWARD}, 0 0 14px 5px ${CX_REWARD}44`,
            }}
            exit={{}}
            transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
            style={{ borderRadius: radius }}
          />
          {/* Spark particles — significant completions only (> 300 chars response) */}
          {significant &&
            SPARK_ANGLES_DEG.map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const tx = Math.cos(rad) * sparkRadius;
              const ty = Math.sin(rad) * sparkRadius;
              return (
                <motion.span
                  key={`spark-${i}`}
                  aria-hidden
                  className="absolute pointer-events-none rounded-full"
                  initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                  animate={{ opacity: 0, x: tx, y: ty, scale: 0 }}
                  exit={{}}
                  transition={{
                    duration: 0.3,
                    ease: [0.22, 1, 0.36, 1],
                    delay: i * 0.018,
                  }}
                  style={{
                    width: 3,
                    height: 3,
                    left: "50%",
                    top: "50%",
                    marginLeft: -1.5,
                    marginTop: -1.5,
                    background: SPARK_COLORS[i],
                  }}
                />
              );
            })}
        </>
      )}
    </AnimatePresence>
  );
}
