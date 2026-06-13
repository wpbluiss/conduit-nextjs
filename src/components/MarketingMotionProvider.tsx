"use client";

import { MotionConfig } from "framer-motion";

/**
 * Wraps all marketing sections so every framer-motion component in the
 * subtree automatically respects the user's prefers-reduced-motion OS
 * setting — no per-component useReducedMotion() calls needed.
 */
export function MarketingMotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
