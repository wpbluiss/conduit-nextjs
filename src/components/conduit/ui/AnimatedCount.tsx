"use client";

/**
 * AnimatedCount — spring-animated integer counter.
 *
 * When `value` changes, the displayed number ticks up/down via a spring,
 * and the element gets a brief scale bounce (1.0 → 1.12 → 1.0, 160ms).
 * Respects prefers-reduced-motion: skips animation, shows new value instantly.
 *
 * Usage:
 *   <AnimatedCount value={42} className="font-mono cx-type-sm" />
 */

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { motion, useSpring, useMotionValueEvent, useAnimation } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface AnimatedCountProps {
  value: number;
  className?: string;
  style?: CSSProperties;
  /** Framer-motion spring config. Defaults to a snappy preset. */
  springConfig?: { stiffness?: number; damping?: number };
}

export function AnimatedCount({
  value,
  className,
  style,
  springConfig,
}: AnimatedCountProps) {
  const prefersReduced = useReducedMotion();
  const spring = useSpring(value, {
    stiffness: springConfig?.stiffness ?? 280,
    damping: springConfig?.damping ?? 28,
  });
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const controls = useAnimation();

  useMotionValueEvent(spring, "change", (v) => setDisplay(Math.round(v)));

  useEffect(() => {
    if (prevRef.current === value) return;
    prevRef.current = value;
    spring.set(value);
    if (!prefersReduced) {
      controls.start({
        scale: [1, 1.12, 1],
        transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] },
      });
    }
  }, [value, spring, controls, prefersReduced]);

  return (
    <motion.span
      animate={controls}
      className={className}
      style={{ display: "inline-block", ...style }}
    >
      {display}
    </motion.span>
  );
}
