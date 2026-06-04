"use client";

import { useEffect, useRef } from "react";
import { animate, useMotionValue, useMotionValueEvent } from "framer-motion";

export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
  duration = 1.1,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  duration?: number;
}) {
  const mv = useMotionValue(0);
  const ref = useRef<HTMLSpanElement>(null);

  useMotionValueEvent(mv, "change", (v) => {
    if (ref.current) {
      ref.current.textContent =
        prefix +
        Number(v).toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }) +
        suffix;
    }
  });

  useEffect(() => {
    const controls = animate(mv, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    return controls.stop;
  }, [value, mv, duration]);

  return (
    <span ref={ref} className={`fin-num ${className}`}>
      {prefix}
      {(0).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}
