/**
 * PraxisLogo — curved P single-letter mark.
 *
 * R2 approximation of the ChatGPT-rendered curved P used by Praxis Mobile
 * R20. Single brand-purple glyph (oklch(50% 0.22 290)), rounded geometric
 * proportions, evenodd-fill bowl interior so the letterform reads cleanly
 * from 14px through 96px. The real exported asset will land in a follow-up
 * ticket; until then this SVG carries the same identity in the rail and
 * onboarding chip.
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
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8 3.5 A0.5 0.5 0 0 1 8.5 3 H11 A5.5 5.5 0 0 1 11 14 V20.5 A0.5 0.5 0 0 1 10.5 21 H8.5 A0.5 0.5 0 0 1 8 20.5 Z M11 6 A2.5 2.5 0 0 1 11 11 Z"
          fill="var(--color-praxis-purple)"
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
