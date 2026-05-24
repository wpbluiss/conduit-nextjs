// pdl — Edge
// Contract: specs/praxis-design-language/contracts/foundations.md §2.11
//
// Curved SVG path between two points. Renders as an inline SVG path
// that consumes the parent Canvas's coordinate space. For multiple
// edges in a Canvas, group them inside a single <svg> overlay (the
// canvas consumer is responsible for the svg wrapper to keep this
// component pure).

interface Props {
  from: { x: number; y: number };
  to: { x: number; y: number };
  /** CSS color; defaults to var(--pdl-edge). */
  tone?: string;
  dashed?: boolean;
  /** Curvature factor; 0 = straight, 1 = strong curve. Default 0.4. */
  curvature?: number;
  strokeWidth?: number;
}

export function Edge({
  from,
  to,
  tone,
  dashed,
  curvature = 0.4,
  strokeWidth = 1,
}: Props) {
  // Quadratic Bezier control point: midpoint offset perpendicular to
  // the line by `curvature` × half the chord length.
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const chord = Math.sqrt(dx * dx + dy * dy);
  // Perpendicular unit vector (clockwise).
  const px = chord === 0 ? 0 : -dy / chord;
  const py = chord === 0 ? 0 : dx / chord;
  const offset = chord * curvature * 0.5;
  const cx = midX + px * offset;
  const cy = midY + py * offset;

  return (
    <path
      d={`M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`}
      fill="none"
      stroke={tone ?? "var(--pdl-edge)"}
      strokeWidth={strokeWidth}
      strokeDasharray={dashed ? "4 4" : undefined}
      strokeLinecap="round"
      opacity={dashed ? 1 : 0.6}
    />
  );
}
