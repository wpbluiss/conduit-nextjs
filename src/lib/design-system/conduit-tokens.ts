/**
 * Conduit Marketing — Design System v2 (2026-05-08)
 *
 * The TS source of truth for marketing surface tokens. CSS counterparts live
 * in `globals.css` (@theme block + utility classes). The /app Console uses
 * the older token set above the marker in globals.css and is not affected.
 *
 * Use these for Framer Motion variants, inline-styled SVGs, and anywhere a
 * JS-side hex/easing value is needed. For static styling, prefer the
 * Tailwind utilities (`bg-ember-500`, `text-cream`, etc.) generated from
 * the CSS @theme tokens.
 */

// ─── Color ────────────────────────────────────────────────────────────────

export const ink = {
  canvas: "#0A0908",
  surface: "#14110F",
  surfaceSubtle: "#1A1612",
  surfaceElevated: "#221C17",
} as const;

export const cream = {
  /** Primary text — warm cream, never pure white */
  primary: "#F5EFE6",
  /** Secondary — captions, subhead, supporting copy */
  secondary: "#B8AC9C",
  /** Tertiary — quieter labels, footer link rest state */
  tertiary: "#847A6E",
  /** Muted — near-canvas, deepest acceptable text contrast */
  muted: "#5A5248",
} as const;

export const edge = {
  subtle: "#221C17",
  default: "#2D2620",
  strong: "#3D352D",
} as const;

/** Conduit Ember — the signature accent. Warm amber, NOT generic orange. */
export const ember = {
  50: "#FBF1E8",
  100: "#F5DDC3",
  300: "#E9AF6F",
  /** Primary ember. Use for CTAs, accents, eyebrow dots. */
  500: "#D67817",
  700: "#8F4709",
  900: "#482402",
} as const;

export const semantic = {
  success: "#4ADE80",
  successBg: "rgba(74, 222, 128, 0.1)",
  warning: "#FBBF24",
  danger: "#F87171",
  info: "#60A5FA",
} as const;

// ─── Typography ───────────────────────────────────────────────────────────

export const fontFamily = {
  display:
    '"Fraunces", ui-serif, Georgia, Cambria, "Times New Roman", serif',
  sans: '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace',
} as const;

export interface TypeStep {
  size: string;
  lineHeight: string;
  tracking: string;
  weight: number;
  family: keyof typeof fontFamily;
  textTransform?: "uppercase";
}

export const type = {
  heroDisplay: {
    size: "clamp(2.5rem, 5vw + 1rem, 5rem)",
    lineHeight: "0.95",
    tracking: "-0.045em",
    weight: 500,
    family: "display",
  },
  display2xl: {
    size: "clamp(2rem, 4vw + 0.5rem, 3.5rem)",
    lineHeight: "1.0",
    tracking: "-0.04em",
    weight: 500,
    family: "display",
  },
  displayXl: {
    size: "clamp(1.75rem, 3vw + 0.5rem, 2.5rem)",
    lineHeight: "1.05",
    tracking: "-0.03em",
    weight: 500,
    family: "display",
  },
  displayLg: {
    size: "clamp(1.5rem, 2vw + 0.5rem, 1.875rem)",
    lineHeight: "1.15",
    tracking: "-0.02em",
    weight: 600,
    family: "display",
  },
  headingMd: {
    size: "1.25rem",
    lineHeight: "1.4",
    tracking: "-0.01em",
    weight: 600,
    family: "sans",
  },
  headingSm: {
    size: "1rem",
    lineHeight: "1.4",
    tracking: "0",
    weight: 600,
    family: "sans",
  },
  bodyLg: {
    size: "1.125rem",
    lineHeight: "1.6",
    tracking: "0",
    weight: 400,
    family: "sans",
  },
  bodyMd: {
    size: "1rem",
    lineHeight: "1.55",
    tracking: "0",
    weight: 400,
    family: "sans",
  },
  bodySm: {
    size: "0.875rem",
    lineHeight: "1.5",
    tracking: "0",
    weight: 400,
    family: "sans",
  },
  caption: {
    size: "0.75rem",
    lineHeight: "1.4",
    tracking: "0.06em",
    weight: 600,
    family: "sans",
    textTransform: "uppercase" as const,
  },
  monoMd: {
    size: "0.875rem",
    lineHeight: "1.5",
    tracking: "-0.01em",
    weight: 500,
    family: "mono",
  },
} satisfies Record<string, TypeStep>;

// ─── Spacing ──────────────────────────────────────────────────────────────

/** 4-pt grid. Section vertical: 96-128px desktop, 64px mobile. */
export const spacing = {
  sectionDesktop: "128px",
  sectionMobile: "64px",
  heroDesktop: "200px",
  heroMobile: "96px",
  containerMax: "1280px",
  proseMax: "720px",
} as const;

// ─── Radii ────────────────────────────────────────────────────────────────

export const radii = {
  xs: "4px",
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  "2xl": "20px",
  full: "9999px",
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────

/** Dark-mode shadows: lift via inset ring, not box-shadow. */
export const shadows = {
  glowSm: "inset 0 0 0 1px rgba(255, 255, 255, 0.05)",
  glowMd:
    "inset 0 0 0 1px rgba(255, 255, 255, 0.08), 0 8px 32px rgba(0, 0, 0, 0.4)",
  glowLg:
    "inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 16px 48px rgba(0, 0, 0, 0.5)",
  /** For primary CTA hover */
  emberGlow: "0 0 48px rgba(214, 120, 23, 0.25)",
  /** For hero ember accent moments */
  emberAura: "0 0 120px rgba(214, 120, 23, 0.15)",
} as const;

// ─── Gradients ────────────────────────────────────────────────────────────

export const gradients = {
  emberRadial:
    "radial-gradient(ellipse 70% 60% at 85% 0%, rgba(214, 120, 23, 0.18) 0%, transparent 60%)",
  emberLine:
    "linear-gradient(90deg, transparent, rgba(214, 120, 23, 0.6), transparent)",
  textWarm: "linear-gradient(135deg, #F5EFE6 0%, #E9AF6F 100%)",
  /** Hero backdrop. Layered radials, ember + violet undertone, very subtle. */
  mesh: `
    radial-gradient(ellipse 80% 60% at 80% 0%, rgba(214, 120, 23, 0.18), transparent 60%),
    radial-gradient(ellipse 60% 50% at 0% 100%, rgba(168, 85, 247, 0.06), transparent 55%),
    radial-gradient(ellipse 50% 40% at 50% 50%, rgba(214, 120, 23, 0.04), transparent 70%)
  `,
} as const;

// ─── Motion ───────────────────────────────────────────────────────────────

export const motion = {
  ease: {
    /** Default easing for nearly all motion. */
    outQuart: [0.25, 1, 0.5, 1] as const,
    inOutQuart: [0.76, 0, 0.24, 1] as const,
  },
  duration: {
    micro: 0.1,
    short: 0.2,
    medium: 0.4,
    long: 0.8,
    cinematic: 1.2,
  },
  /** Stagger between hero children — 60ms */
  staggerChildren: 0.06,
} as const;

// ─── Iconography ──────────────────────────────────────────────────────────

/** Phosphor icons configuration. NEVER use Lucide on marketing surfaces. */
export const iconConfig = {
  weight: "regular" as const,
  size: 20,
  color: "currentColor",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Apply a TypeStep as a React style object. */
export function typeStepStyle(step: TypeStep): React.CSSProperties {
  return {
    fontFamily: fontFamily[step.family],
    fontSize: step.size,
    lineHeight: step.lineHeight,
    letterSpacing: step.tracking,
    fontWeight: step.weight,
    ...(step.textTransform ? { textTransform: step.textTransform } : {}),
  };
}

/** Convenience: hero stagger variants for Framer Motion */
export const heroStagger = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: motion.staggerChildren,
        delayChildren: 0.1,
      },
    },
  },
  child: {
    hidden: { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: motion.duration.long,
        ease: motion.ease.outQuart,
      },
    },
  },
} as const;
