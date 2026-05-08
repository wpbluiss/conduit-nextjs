/**
 * Conduit BrandMark — v3 institutional indigo rails.
 *
 * The wordmark + parallel-rails geometric mark used in the marketing nav,
 * footer, and any institutional surface. The mark signals
 * channel/conduit — three flow lines, varying length, with source dots at
 * the input side. Clean, geometric, indigo-500. NOT an ember filled circle.
 *
 * Existing /public/logo.svg + Logo.tsx (ember "C") are preserved for
 * celebration-only contexts: favicon, OG image, customer celebration cards.
 */

import Link from "next/link";

type Tone = "default" | "inverse";

export function BrandMark({
  size = 28,
  tone = "default",
}: {
  size?: number;
  tone?: Tone;
}) {
  const stroke = tone === "inverse" ? "#A8AFFB" : "#5B63E8";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="shrink-0"
      fill="none"
    >
      {/* Three parallel rails — channel/conduit. Middle rail extends furthest
          to create asymmetric balance and signal the "primary channel." */}
      <circle cx="6" cy="10" r="1.6" fill={stroke} />
      <line
        x1="9"
        y1="10"
        x2="22"
        y2="10"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx="6" cy="16" r="1.8" fill={stroke} />
      <line
        x1="9"
        y1="16"
        x2="26"
        y2="16"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="6" cy="22" r="1.6" fill={stroke} />
      <line
        x1="9"
        y1="22"
        x2="20"
        y2="22"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

/**
 * Wordmark — Fraunces medium, with the BrandMark glyph to the left.
 * Use in nav + footer. Pass `tone="inverse"` on dark sections.
 *
 * `size` controls the wordmark text size. Mark scales proportionally.
 */
export function BrandWordmark({
  size = 17,
  tone = "default",
  className = "",
}: {
  size?: number;
  tone?: Tone;
  className?: string;
}) {
  const markSize = Math.round(size * 1.6);
  const color = tone === "inverse"
    ? "var(--color-ink-on-inverse)"
    : "var(--color-ink-primary)";
  return (
    <span
      className={`inline-flex items-center gap-2.5 ${className}`}
      style={{ color }}
    >
      <BrandMark size={markSize} tone={tone} />
      <span
        style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 500,
          fontSize: `${size}px`,
          letterSpacing: "-0.01em",
          lineHeight: 1,
        }}
      >
        Conduit
      </span>
    </span>
  );
}

/**
 * BrandLink — wrapper that turns the wordmark into a homepage link.
 * Default for nav usage.
 */
export function BrandLink({
  size = 17,
  tone = "default",
  href = "/",
}: {
  size?: number;
  tone?: Tone;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2.5 group"
      aria-label="Conduit"
    >
      <BrandWordmark size={size} tone={tone} />
    </Link>
  );
}
