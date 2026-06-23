/**
 * Canonical icon mapping for Praxis specialist departments.
 *
 * One coherent set: all icons from lucide-react, uniform 1.75px stroke,
 * 20/24px optical sizes. Active/selected state uses --cx-accent (electric violet).
 *
 * Import SPECIALIST_ICON wherever a department icon is needed — never reach
 * for one-off lucide imports for this purpose.
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
  jarvis: Compass,        // Atlas — routes work, holds the bigger picture
  marketing: Megaphone,   // Content + Brand
  sales: TrendingUp,      // Pipeline + Outreach
  engineering: Code2,     // Build + Ship
  finance: DollarSign,    // Numbers + Runway
  compliance: ShieldCheck, // Rules + Risk
  hr: HeartHandshake,     // People + Culture
  ops: Workflow,          // Process + Systems
  legal: Scale,           // Contracts + Counsel
};

/**
 * Canonical stroke width for all lucide icons across the console.
 * Spec: CONSOLE_REDESIGN.md §Iconography — "uniform stroke (1.75–2px)".
 * Use strokeWidth={2} for sub-12px icons where 1.75px hairlines hurt legibility.
 */
export const ICON_STROKE = 1.75 as const;

/** Uniform stroke width for specialist icons — canonical value for icon system. */
export const SPECIALIST_ICON_STROKE = ICON_STROKE;
