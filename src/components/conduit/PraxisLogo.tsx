/**
 * PraxisLogo — geometric purple prism mark.
 *
 * Three-faced isometric cube. Single form, three brand-purple tones
 * for depth (hi → base → deep). Lands in:
 *   - Sidebar header (replacing the legacy dot+wordmark)
 *   - OnboardingModal eyebrow
 *   - Any "Praxis" attribution chip in /app
 *
 * Mirrors Praxis Mobile R19 brand spec — same prism, same tonal axis.
 * Renders crisply at 14px through 96px.
 */

interface Props {
  size?: number;
  withWordmark?: boolean;
  className?: string;
  /** Adds a soft outer glow via the `.praxis-mark` filter token. */
  glow?: boolean;
}

export function PraxisLogo({
  size = 22,
  withWordmark = false,
  className = "",
  glow = false,
}: Props) {
  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      aria-label="Praxis"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className={glow ? "praxis-mark" : undefined}
        style={{ display: "block" }}
      >
        {/* Top face — brightest */}
        <path
          d="M12 2 L22 7 L12 12 L2 7 Z"
          fill="var(--color-praxis-purple-hi)"
        />
        {/* Left face — base purple */}
        <path
          d="M2 7 L2 17 L12 22 L12 12 Z"
          fill="var(--color-praxis-purple)"
        />
        {/* Right face — deepest, gives the prism its volume */}
        <path
          d="M22 7 L22 17 L12 22 L12 12 Z"
          fill="var(--color-praxis-purple-deep)"
        />
        {/* Inner edges — hairline highlight along the top seams */}
        <path
          d="M2 7 L12 12 L22 7"
          stroke="oklch(85% 0.10 290)"
          strokeWidth="0.6"
          strokeOpacity="0.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 12 L12 22"
          stroke="oklch(85% 0.10 290)"
          strokeWidth="0.6"
          strokeOpacity="0.25"
          strokeLinecap="round"
        />
      </svg>
      {withWordmark && (
        <span
          className="serif text-[var(--color-text)]"
          style={{ fontSize: Math.round(size * 0.95), lineHeight: 1 }}
        >
          Praxis
        </span>
      )}
    </span>
  );
}
