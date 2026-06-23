/**
 * Canonical icon system for the Praxis console.
 *
 * One coherent set: all icons from lucide-react, uniform 1.75px stroke,
 * 20/24px optical sizes. Active/selected state uses --cx-accent (electric violet).
 *
 * Import SPECIALIST_ICON wherever a department icon is needed — never reach
 * for one-off lucide imports for this purpose.
 *
 * Size guide (use these constants, never ad-hoc values in nav/sidebar):
 *   ICON_SIZE_NAV    = 20 — primary sidebar nav items, specialist roster
 *   ICON_SIZE_INLINE = 16 — secondary strip items, menu actions, toolbar
 *   Smaller sizes (8–14) are intentional for badges, chips, and metadata glyphs.
 *
 * Stroke guide:
 *   ICON_STROKE    = 1.75 — all standard icons
 *   Use strokeWidth={2} for icons ≤12px where 1.75px hairlines hurt legibility.
 *   Always pass strokeWidth as a prop, never via style={{ strokeWidth }}.
 */
import {
  Code2,
  Compass,
  DollarSign,
  HeartHandshake,
  Megaphone,
  Scale,
  ShieldCheck,
  TrendingUp,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import type { EmployeeKey } from "@/lib/ai/provider";

/** Distinct, recognizable lucide icon for each Praxis specialist department. */
export const SPECIALIST_ICON: Record<EmployeeKey, LucideIcon> = {
  jarvis: Compass,         // Atlas — routes work, holds the bigger picture
  marketing: Megaphone,    // Content + Brand
  sales: TrendingUp,       // Pipeline + Outreach
  engineering: Code2,      // Build + Ship
  finance: DollarSign,     // Numbers + Runway
  compliance: ShieldCheck, // Rules + Risk
  hr: HeartHandshake,      // People + Culture
  ops: Workflow,           // Process + Systems
  legal: Scale,            // Contracts + Counsel
};

/** Canonical stroke width for all lucide icons across the console. */
export const ICON_STROKE = 1.75 as const;

/** Alias kept for call-site clarity — same value as ICON_STROKE. */
export const SPECIALIST_ICON_STROKE = ICON_STROKE;

/** Size for primary sidebar nav icons and specialist roster items. */
export const ICON_SIZE_NAV = 20 as const;

/** Size for secondary strip items, menu actions, and toolbar glyphs. */
export const ICON_SIZE_INLINE = 16 as const;
