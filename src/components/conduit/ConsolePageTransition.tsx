"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { CX_DUR_BASE, CX_DUR_EXIT, CX_EASE, CX_EASE_INOUT } from "@/lib/ui/motion";

/**
 * ConsolePageTransition — wraps the content panel so route changes animate.
 *
 * Uses the pathname as the key so framer-motion treats each route as a
 * distinct element. The sidebar (outside this wrapper) never remounts.
 *
 * Enter: opacity 0→1 + y 6→0 at 180ms (CX_EASE)
 * Exit:  opacity 1→0 at 150ms (CX_EASE_INOUT) — fast so nav feels instant
 *
 * mode="wait": old content exits before new enters, preventing simultaneous
 * render of both pages (avoids doubled fixed-position elements).
 *
 * Reduced-motion: MotionConfig in ConsoleMotionProvider sets reducedMotion:"user",
 * so framer-motion automatically skips transitions when the OS preference is set.
 * No manual useReducedMotion() call needed here.
 */
export function ConsolePageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        className="flex-1 flex flex-col min-h-0"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4, transition: { duration: CX_DUR_EXIT, ease: [...CX_EASE_INOUT] } }}
        transition={{ duration: CX_DUR_BASE, ease: [...CX_EASE] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
