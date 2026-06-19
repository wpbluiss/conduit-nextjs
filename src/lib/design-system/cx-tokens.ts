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

// Alpha variants — for framer-motion box-shadow keyframes that interpolate
// between transparent and the full reward glow.
export const CX_REWARD_RING      = "rgba(52, 211, 153, 0.40)"; // 40% — ring at peak
export const CX_REWARD_RING_FADE = "rgba(52, 211, 153, 0)";    // 0%  — ring at rest

// Accent tint — for framer-motion / SVG fill consumers.
export const CX_ACCENT_TINT = "rgba(124, 108, 255, 0.12)";

// ─── Glass recipe (JS mirror for SVG fills, Framer Motion, Canvas 2D) ────────
// These are dark-mode defaults — when using CSS, prefer var(--cx-glass-*) so
// theme overrides (light mode, prefers-reduced-transparency) apply automatically.
//
// Three depth tiers mirror the CONSOLE_REDESIGN.md glassmorphism hierarchy:
//   raised  → sidebar, cards, composer
//   float   → menus, popovers, toasts
//   overlay → modals, drawers (heaviest)

export const CX_GLASS_BG           = "rgba(255, 255, 255, 0.04)";  // raised tier
export const CX_GLASS_BG_FLOAT     = "rgba(255, 255, 255, 0.06)";  // float tier
export const CX_GLASS_BG_OVERLAY   = "rgba(255, 255, 255, 0.06)";  // overlay tier
export const CX_GLASS_BG_ACCENT    = "rgba(124, 108, 255, 0.08)";  // accent-tinted
export const CX_GLASS_BORDER       = "rgba(255, 255, 255, 0.08)";  // hairline edge
export const CX_GLASS_HIGHLIGHT    = "inset 0 1px 0 rgba(255, 255, 255, 0.10)";
export const CX_GLASS_BLUR           = "blur(20px) saturate(140%)";  // raised
export const CX_GLASS_BLUR_FLOAT     = "blur(24px) saturate(150%)";  // float
export const CX_GLASS_BLUR_OVERLAY   = "blur(28px) saturate(160%)";  // overlay
export const CX_GLASS_SHADOW           = "0 1px 3px rgba(0, 0, 0, 0.40), 0 4px 16px rgba(0, 0, 0, 0.30)";
export const CX_GLASS_SHADOW_FLOAT     = "0 4px 24px rgba(0, 0, 0, 0.60), 0 2px 8px rgba(0, 0, 0, 0.40)";
export const CX_GLASS_SHADOW_OVERLAY   = "0 8px 40px rgba(0, 0, 0, 0.70), 0 4px 12px rgba(0, 0, 0, 0.50)";

// Scrim / overlay backdrop blur — subtle background blur for modal backdrops and tour overlays.
// Intentionally lighter than glass blur; not a frosted-glass surface.
export const CX_SCRIM_BLUR = "blur(2px)";
