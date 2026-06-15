"use client";

import { MotionConfig } from "framer-motion";
import { type ReactNode } from "react";
import { CX_DUR_BASE, CX_EASE } from "@/lib/ui/motion";

/**
 * ConsoleMotionProvider — global MotionConfig for the /app shell.
 *
 * Sets reducedMotion: "user" so every framer-motion component inside the
 * console respects the OS prefers-reduced-motion setting without each
 * component needing to call useReducedMotion() individually.
 *
 * Also sets sane default transition values matching the --cx-dur-default
 * and --cx-ease CSS tokens, so ad-hoc <motion.div> without explicit
 * transition gets the right rhythm.
 *
 * Components that need a different transition (e.g. springs on buttons)
 * still provide their own — MotionConfig defaults are overridden per-element.
 */
export function ConsoleMotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{
        duration: CX_DUR_BASE,
        ease: [...CX_EASE],
      }}
    >
      {children}
    </MotionConfig>
  );
}
