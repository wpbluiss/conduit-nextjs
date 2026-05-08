/**
 * Conduit Marketing — Design System v3 (2026-05-08)
 *
 * Light-first institutional palette. Indigo replaces ember as primary.
 * Ember demoted to celebration-only (Lunaro card, hover-bloom moments,
 * "shipping now" status pips).
 *
 * The TS source of truth for marketing surface tokens. CSS counterparts live
 * in `globals.css` (@theme block + utility classes). The /app Console uses
 * the older token set above the marker in globals.css and is not affected.
 *
 * Use these for Framer Motion variants, inline-styled SVGs, and anywhere a
 * JS-side hex/easing value is needed. For static styling, prefer the
 * Tailwind utilities (`bg-indigo-500`, `text-ink-primary`, etc.) generated
 * from the CSS @theme tokens.
 */

// ─── Color ────────────────────────────────────────────────────────────────

/** Background surfaces — light-first, warm bone canvas. */
export const bg = {
  /** Page canvas — warm bone, paper-like. The default body bg. */
  canvas: "#FAFAF7",
  /** Surface — pure white, used for cards and elevated content. */
  surface: "#FFFFFF",
  /** Subtle — hover states, secondary tier. */
  surfaceSubtle: "#F4F2EC",
  /** Sunken — inset surfaces, code blocks, pre tags. */
  surfaceSunken: "#EEEBE3",
  /** Inverse — for hero band, CTA band, cinematic anchor sections. */
  inverse: "#0A0908",
  inverseElevated: "#14110F",
} as const;

/** Ink — text colors. Dark on light, light on inverse. */
export const ink = {
  /** Primary text on light bg — near-black with cool blue undertone. */
  primary: "#0F1115",
  /** Secondary text on light bg — supporting copy, captions. */
  secondary: "#4A5160",
  /** Tertiary text on light bg — quietest readable tier. */
  tertiary: "#7B8194",
  /** On inverse (dark bg) — warm cream, never pure white. */
  onInverse: "#F5EFE6",
  onInverseSoft: "#B8AC9C",
  onInverseMute: "#847A6E",
} as const;

/** Borders — light-mode subtle hairlines. */
export const border = {
  subtle: "#EDE9E2",
  default: "#E0DACF",
  strong: "#C9C2B5",
  onInverse: "#2D2620",
  onInverseStrong: "#3D352D",
} as const;

/**
 * Conduit Indigo — primary accent.
 * Deep institutional indigo. Trust, gravitas, AI-native without being
 * default-blue.
 */
export const indigo = {
  50: "#EEF0FF",
  100: "#DDE0FE",
  300: "#A8AFFB",
  /** Primary indigo. Use for CTAs, accents, eyebrow dots. */
  500: "#5B63E8",
  700: "#3D44C2",
  900: "#1F2380",
} as const;

/**
 * Conduit Ember — DEMOTED in v3.
 * Reserved for celebration only:
 *   - Hero CTA hover bloom (energy moment)
 *   - "Live" / "shipping now" status pips
 *   - Lunaro customer celebration card
 * NOT for primary buttons, NOT for nav, NOT for body accents.
 */
export const ember = {
  50: "#FBF1E8",
  100: "#F5DDC3",
  300: "#E9AF6F",
  500: "#D67817",
  700: "#8F4709",
  900: "#482402",
} as const;

export const semantic = {
  success: "#16A34A",
  successBg: "rgba(22, 163, 74, 0.10)",
  warning: "#CA8A04",
  danger: "#DC2626",
  info: "#2563EB",
} as const;

/** ─── Legacy aliases — back-compat for v2 component code. ───
 *  Mapped to the v3 light-first values so existing usages stay live.
 *  Prefer the new names (bg.*, ink.*, border.*) in new code. */
export const cream = {
  primary: ink.primary,
  secondary: ink.secondary,
  tertiary: ink.tertiary,
  muted: "#A09A8E",
} as const;
export const edge = {
  subtle: border.subtle,
  default: border.default,
  strong: border.strong,
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

/** Light-mode shadows — real shadows, no inset rings. */
export const shadows = {
  sm: "0 1px 2px rgba(15, 17, 21, 0.04), 0 0 0 1px rgba(15, 17, 21, 0.04)",
  md: "0 4px 16px rgba(15, 17, 21, 0.06), 0 0 0 1px rgba(15, 17, 21, 0.04)",
  lg: "0 16px 48px rgba(15, 17, 21, 0.10), 0 0 0 1px rgba(15, 17, 21, 0.05)",
  /** Indigo glow — for primary CTA hover. */
  indigoGlow: "0 0 48px rgba(91, 99, 232, 0.32)",
  /** Indigo aura — for hero accent moments. */
  indigoAura: "0 0 120px rgba(91, 99, 232, 0.18)",
  /** Inverse-mode shadows — for content on dark sections. */
  inverseSm: "inset 0 0 0 1px rgba(255, 255, 255, 0.05)",
  inverseMd:
    "inset 0 0 0 1px rgba(255, 255, 255, 0.08), 0 8px 32px rgba(0, 0, 0, 0.4)",
  inverseLg:
    "inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 16px 48px rgba(0, 0, 0, 0.5)",
} as const;

// ─── Gradients ────────────────────────────────────────────────────────────

export const gradients = {
  /** Primary — indigo radial, top-right anchored. Light bg version. */
  indigoRadial:
    "radial-gradient(ellipse 70% 60% at 85% 0%, rgba(91, 99, 232, 0.10) 0%, transparent 60%)",
  /** Hairline indigo divider. */
  indigoLine:
    "linear-gradient(90deg, transparent, rgba(91, 99, 232, 0.55), transparent)",
  indigoLineStrong:
    "linear-gradient(90deg, transparent, rgba(91, 99, 232, 0.85), transparent)",
  /** Light-bg text gradient — ink-primary → indigo-700. Subtle gravity. */
  textLight: "linear-gradient(135deg, #0F1115 0%, #3D44C2 100%)",
  /** Inverse-bg text gradient — white → indigo-300 for dark sections. */
  textInverse: "linear-gradient(135deg, #FFFFFF 0%, #A8AFFB 100%)",
  /** Hero mesh — light bg. Layered indigo radials, low alpha. */
  meshLight: `
    radial-gradient(ellipse 80% 60% at 80% 0%, rgba(91, 99, 232, 0.08), transparent 60%),
    radial-gradient(ellipse 60% 50% at 0% 100%, rgba(168, 85, 247, 0.04), transparent 55%),
    radial-gradient(ellipse 50% 40% at 50% 50%, rgba(91, 99, 232, 0.03), transparent 70%)
  `,
  /** Hero mesh — inverse (dark) bg. Stronger indigo radials. */
  meshInverse: `
    radial-gradient(ellipse 80% 60% at 80% 0%, rgba(91, 99, 232, 0.18), transparent 60%),
    radial-gradient(ellipse 60% 50% at 0% 100%, rgba(168, 85, 247, 0.07), transparent 55%),
    radial-gradient(ellipse 50% 40% at 50% 50%, rgba(91, 99, 232, 0.04), transparent 70%)
  `,
  /** Ember celebration — for Lunaro card / energy moments only. */
  emberRadial:
    "radial-gradient(ellipse 70% 60% at 85% 0%, rgba(214, 120, 23, 0.18) 0%, transparent 60%)",
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
    /** Cinematic — institutional pace. v3 raised from 1.2s to 1.5s. */
    cinematic: 1.5,
  },
  /** Stagger between hero children — slowed in v3 for institutional feel */
  staggerChildren: 0.12,
  /** Hero pacing — institutional, not hyperactive */
  heroPacing: {
    eyebrow: 0,
    headline: 0.2,
    subhead: 0.5,
    cta: 0.8,
    proofStrip: 1.1,
  },
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

/** Hero stagger variants for Framer Motion — institutional pace. */
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
        duration: motion.duration.cinematic,
        ease: motion.ease.outQuart,
      },
    },
  },
} as const;
