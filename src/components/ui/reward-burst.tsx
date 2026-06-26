"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CX_REWARD, CX_ACCENT, CX_ACCENT_BRIGHT } from "@/lib/design-system/cx-tokens";

// 5 evenly-spaced angles — spec: "≤5 particles, GPU-friendly"
const SPARK_COUNT = 5;
const SPARK_ANGLES_DEG = Array.from(
  { length: SPARK_COUNT },
  (_, i) => (360 / SPARK_COUNT) * i,
);
const SPARK_COLORS = SPARK_ANGLES_DEG.map((_, i) =>
  i % 3 === 0 ? CX_ACCENT_BRIGHT : i % 3 === 1 ? CX_REWARD : CX_ACCENT,
);

/**
 * RewardBurst — celebratory beat for specialist completions and build-shipped events.
 *
 * Renders as an absolutely-positioned overlay; place inside a `position: relative`
 * parent (e.g. the specialist avatar container or a completion card).
 *
 * Full-motion path:
 *   - Expanding accent→reward-green glow ring (520ms, [0.22,1,0.36,1])
 *   - Up to 5 GPU-cheap spark particles that burst outward (300ms, staggered 18ms) —
 *     only when `significant` is true (e.g. substantive response, build success)
 *
 * Reduced-motion path (`prefers-reduced-motion: reduce`):
 *   - Simple reward-green opacity flash (250ms) — no scale, no particles
 *
 * No layout shift: the animation layer uses `position: absolute` with
 * `pointer-events: none` and does not affect document flow.
 */
export interface RewardBurstProps {
  /** Controls visibility — set true to trigger the animation. */
  rewarded: boolean;
  /** When true, also fire the radial spark burst. Use for significant completions. */
  significant?: boolean;
  /** Parent element size in px — scales the spark burst radius. Default 32. */
  size?: number;
}

export function RewardBurst({
  rewarded,
  significant = false,
  size = 32,
}: RewardBurstProps) {
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
            style={{ borderRadius: radius, background: CX_REWARD }}
          />
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {rewarded && (
        <>
          {/* Expanding accent→reward-green glow ring — every completion */}
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
          {/* Spark particles — significant completions only */}
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
