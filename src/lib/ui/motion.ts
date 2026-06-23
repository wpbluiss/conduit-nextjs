/**
 * Praxis console motion constants — JS-land mirror of the --cx-dur-* / --cx-ease*
 * CSS tokens in console-tokens.css. Import these instead of hardcoding values so
 * framer-motion usage stays in sync with the CSS token layer.
 *
 * Usage:
 *   import { CX_EASE, CX_DUR_BASE, CX_SPRING_SNAPPY, FADE_UP } from "@/lib/ui/motion"
 *   <motion.div initial={FADE_UP.initial} animate={FADE_UP.animate} transition={FADE_UP.transition} />
 */

// ─── Easing ──────────────────────────────────────────────────────────────────

/** "Snappy spring" — enters, hovers, micro-feedback. Matches --cx-ease. */
export const CX_EASE = [0.22, 1, 0.36, 1] as const;

/** Symmetric — exits, fades. Matches --cx-ease-inout. */
export const CX_EASE_INOUT = [0.4, 0, 0.2, 1] as const;

// ─── Durations (seconds) ──────────────────────────────────────────────────────

/** 120 ms — micro-feedback, icon presses. Matches --cx-dur-fast. */
export const CX_DUR_FAST = 0.12;

/** 180 ms — default transitions, hover lifts. Matches --cx-dur-default. */
export const CX_DUR_BASE = 0.18;

/** 220 ms — emphasis enters, reward moments. Matches --cx-dur-emphasis. */
export const CX_DUR_EMPHASIS = 0.22;

/** 150 ms — exits, dismiss animations. Matches --cx-dur-exit. */
export const CX_DUR_EXIT = 0.15;

// ─── Spring configs ───────────────────────────────────────────────────────────

/**
 * Snappy spring — tactile button press + springy release.
 * stiffness/damping chosen for <120 ms press, ~200 ms springy return.
 */
export const CX_SPRING_SNAPPY = {
  type: "spring" as const,
  stiffness: 500,
  damping: 30,
  mass: 0.8,
};

/**
 * Soft spring — card / panel entrances; less aggressive than SNAPPY.
 */
export const CX_SPRING_SOFT = {
  type: "spring" as const,
  stiffness: 280,
  damping: 26,
  mass: 0.9,
};

// ─── Reusable transition objects ──────────────────────────────────────────────

/** Standard ease transition at base duration. */
export const TX_BASE = {
  duration: CX_DUR_BASE,
  ease: CX_EASE,
} as const;

/** Fast ease transition for hover lifts / icon micro-interactions. */
export const TX_FAST = {
  duration: CX_DUR_FAST,
  ease: CX_EASE,
} as const;

/** Emphasis ease for enters and reward moments. */
export const TX_EMPHASIS = {
  duration: CX_DUR_EMPHASIS,
  ease: CX_EASE,
} as const;

/** Exit ease — symmetric, slightly faster. */
export const TX_EXIT = {
  duration: CX_DUR_EXIT,
  ease: CX_EASE_INOUT,
} as const;

// ─── Composed variants ────────────────────────────────────────────────────────

/**
 * Fade + slide up — use for message bubbles, cards, list items entering.
 * GPU-safe: only transforms opacity + y (no layout triggers).
 */
export const FADE_UP = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -4 },
  transition: TX_BASE,
} as const;

/**
 * Message "just sent" — slightly more physical than FADE_UP: scale comes from
 * 0.98 so the bubble feels like it was launched from the composer below.
 * Same duration and easing so it doesn't feel heavier.
 */
export const MESSAGE_SENT = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: TX_BASE,
} as const;

/**
 * Fade in only — for elements that appear but shouldn't slide.
 */
export const FADE_IN = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
  transition: TX_FAST,
} as const;

/**
 * Scale pop — for reward moments, badges, count ticks.
 * Springy and brief so it reads as celebration without being annoying.
 */
export const SCALE_POP = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1,   opacity: 1 },
  exit:    { scale: 0.9, opacity: 0 },
  transition: CX_SPRING_SNAPPY,
} as const;
