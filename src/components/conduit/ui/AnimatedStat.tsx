"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

interface AnimatedStatProps {
  value: number;
  format?: (n: number) => string;
  /** Animation duration in ms. Default 600. */
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

const defaultFormat = (n: number) => n.toLocaleString();

// Ease-out cubic — approximates the spec's cubic-bezier(0.22,1,0.36,1) for count-up
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * AnimatedStat — counts up from 0 to `value` on mount.
 * Renders a <span> with `className` (default: "cx-stat").
 * Respects prefers-reduced-motion: shows final value immediately when reduced.
 *
 * Usage (server or client components):
 *   <AnimatedStat value={conversationCount} />
 *   <AnimatedStat value={voiceMinutes} format={(n) => `${n} min`} />
 */
export function AnimatedStat({
  value,
  format = defaultFormat,
  duration = 600,
  className = "cx-stat",
  style,
}: AnimatedStatProps) {
  const prefersReduced = useReducedMotion();
  // Start at 0 on client; updated by the RAF loop.
  // prefersReduced short-circuits to final value.
  const [display, setDisplay] = useState(prefersReduced ? value : 0);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReduced) {
      setDisplay(value);
      return;
    }

    // Reset for re-animations when value changes.
    startRef.current = null;

    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOut(progress);
      setDisplay(Math.round(eased * value));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure we end exactly on the target value.
        setDisplay(value);
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      startRef.current = null;
    };
  }, [value, duration, prefersReduced]);

  return (
    <span className={className} style={style} aria-label={format(value)}>
      {format(display)}
    </span>
  );
}
