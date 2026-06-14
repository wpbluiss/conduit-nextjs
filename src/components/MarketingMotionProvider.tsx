"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Wraps the marketing pages in a MotionConfig that automatically respects
 * the user's prefers-reduced-motion OS setting. All framer-motion animations
 * in child components will be disabled when the user has requested reduced
 * motion — without each component needing its own useReducedMotion() check.
 */
export function MarketingMotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
