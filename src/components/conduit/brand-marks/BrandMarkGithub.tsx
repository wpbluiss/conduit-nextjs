// PLACEHOLDER MARK — simplified geometric form.
// Swap to licensed/official brand asset before public release.
// Theme-aware: ink color flips between modes.

interface Props {
  size?: number;
  className?: string;
}

export function BrandMarkGithub({ size = 24, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
        fontSize="11"
        fontWeight="700"
        fill="var(--pdl-surface)"
      >
        gh
      </text>
    </svg>
  );
}
