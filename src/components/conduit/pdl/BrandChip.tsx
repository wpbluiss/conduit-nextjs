// pdl — BrandChip
// Contract: specs/praxis-design-language/contracts/foundations.md §2.1
//
// Circular surface chip containing a real brand mark. The chip surface
// adapts to the theme; the brand mark inside renders according to its
// own theme rules (some marks are mono + currentColor, others are
// full-color per brand).

import { BRAND_MARKS, type BrandKind } from "@/components/conduit/brand-marks";

interface Props {
  kind: BrandKind;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const INNER_PCT = 0.62; // 62% of chip diameter for the brand-mark glyph

const PX: Record<NonNullable<Props["size"]>, number> = {
  sm: 20,
  md: 32,
  lg: 48,
};

export function BrandChip({ kind, size = "md", className }: Props) {
  const Mark = BRAND_MARKS[kind];
  const chipPx = PX[size];
  const innerPx = Math.round(chipPx * INNER_PCT);
  return (
    <span
      className={`pdl-brand-chip${className ? ` ${className}` : ""}`}
      data-size={size}
      data-brand={kind}
      role="img"
      aria-label={kind}
    >
      <Mark size={innerPx} />
    </span>
  );
}
