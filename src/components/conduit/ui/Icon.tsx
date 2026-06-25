/**
 * Praxis console canonical Icon wrapper.
 *
 * Enforces the uniform iconography system from CONSOLE_REDESIGN.md:
 *   - Stroke: 1.75px (ICON_STROKE) for all standard icons
 *   - Named size aliases map to the canonical grid (never raw px except
 *     for intentional badge/chip glyphs that have their own scale)
 *   - aria-hidden="true" by default — pass aria-label to expose to AT
 *
 * ## Size aliases
 * | Alias     | px | Usage                                                |
 * |-----------|----|------------------------------------------------------|
 * | "nav"     | 20 | Primary sidebar nav items, specialist roster         |
 * | "inline"  | 16 | Secondary strip items, menu actions, toolbar glyphs  |
 * | "sm"      | 14 | Inline text glyphs, badge indicators                 |
 * | "xs"      | 12 | Chip icons, tiny metadata glyphs                     |
 * | number    | —  | Intentional overrides (avatars, custom art)          |
 *
 * ## Stroke exceptions
 * Icons ≤12px may pass strokeWidth={2} directly on the Lucide component
 * for legibility (hairlines disappear at small sizes). The CSS global rule
 * .praxis-root svg.lucide { stroke-width: 1.75 } is the fallback; the prop
 * overrides it for the few exceptions that need optical correction.
 *
 * ## Usage
 * ```tsx
 * import { CxIcon } from "@/components/conduit/ui/Icon"
 * import { Settings } from "lucide-react"
 *
 * // Named size
 * <CxIcon icon={Settings} size="inline" style={{ color: "var(--cx-text-muted)" }} />
 *
 * // Active accent color
 * <CxIcon icon={LayoutGrid} size="nav" style={{ color: "var(--cx-accent)" }} />
 *
 * // With accessible label (removes aria-hidden)
 * <CxIcon icon={Search} size="inline" aria-label="Search conversations" />
 * ```
 */

import type { LucideIcon, LucideProps } from "lucide-react";
import { ICON_STROKE, ICON_SIZE_NAV, ICON_SIZE_INLINE } from "@/lib/ui/specialist-icons";

export type CxIconSize = "nav" | "inline" | "sm" | "xs" | number;

const SIZE_PX: Record<string, number> = {
  nav:    ICON_SIZE_NAV,     // 20
  inline: ICON_SIZE_INLINE,  // 16
  sm:     14,
  xs:     12,
};

function resolveSize(size: CxIconSize): number {
  return typeof size === "number" ? size : (SIZE_PX[size] ?? ICON_SIZE_INLINE);
}

export interface CxIconProps extends Omit<LucideProps, "size" | "strokeWidth" | "ref"> {
  /** The Lucide icon component to render. */
  icon: LucideIcon;
  /** Named size alias or exact px value. Default: "inline" (16px). */
  size?: CxIconSize;
  /**
   * Stroke width override. Omit to use the canonical 1.75px.
   * Only pass 2 for icons at ≤12px where hairlines hurt legibility.
   */
  strokeWidth?: number;
}

/**
 * Canonical icon renderer for Praxis console surfaces.
 * Enforces uniform stroke width and named size aliases.
 */
export function CxIcon({
  icon: IconComponent,
  size = "inline",
  strokeWidth = ICON_STROKE,
  "aria-label": ariaLabel,
  ...rest
}: CxIconProps) {
  const px = resolveSize(size);
  return (
    <IconComponent
      size={px}
      strokeWidth={strokeWidth}
      aria-hidden={ariaLabel ? undefined : "true"}
      aria-label={ariaLabel}
      {...rest}
    />
  );
}
