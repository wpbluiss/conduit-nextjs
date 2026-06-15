/**
 * Praxis Console — JS-land mirror of console-tokens.css --cx-* token values.
 *
 * Use these when CSS variables can't be referenced directly — SVG fill
 * attributes, framer-motion keyframe colors, Canvas 2D, etc.
 *
 * IMPORTANT: Keep these values in sync with the `--cx-*` declarations in
 * src/styles/console-tokens.css. That file is the source of truth for the
 * dark-mode defaults; this file mirrors them for JS consumers.
 *
 * For static styling, prefer Tailwind utilities or `var(--cx-*)` inline styles.
 */

// ─── Ink: background tiers ────────────────────────────────────────────────────

export const CX_CANVAS          = "#0B0B0F";
export const CX_SURFACE         = "#131319";
export const CX_SURFACE_RAISED  = "#1C1C26";
export const CX_SURFACE_OVERLAY = "#23232E";

// ─── Borders / hairlines ──────────────────────────────────────────────────────

export const CX_BORDER        = "#262630";
export const CX_BORDER_STRONG = "#33333F";

// ─── Text scale ──────────────────────────────────────────────────────────────

export const CX_TEXT       = "#F4F4F7";
export const CX_TEXT_MUTED = "#A0A0B0";
export const CX_TEXT_FAINT = "#6B6B7B";

// ─── Electric violet accent ───────────────────────────────────────────────────

export const CX_ACCENT        = "#7C6CFF";
export const CX_ACCENT_BRIGHT = "#9B8CFF";
export const CX_ACCENT_DEEP   = "#5548CC";

// ─── Semantic signals ─────────────────────────────────────────────────────────

export const CX_REWARD = "#34D399";
export const CX_DANGER = "#F4607D";
