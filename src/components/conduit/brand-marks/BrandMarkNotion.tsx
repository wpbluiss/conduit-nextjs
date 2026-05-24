// PLACEHOLDER MARK — simplified geometric form.
// Swap to licensed/official brand asset before public release.
// Theme-aware: ink color flips between modes.

interface Props {
  size?: number;
  className?: string;
}

export function BrandMarkNotion({ size = 24, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="3" fill="var(--pdl-surface-raised)" stroke="currentColor" strokeWidth="1" />
      <text
        x="12"
        y="17"
        textAnchor="middle"
        fontFamily="var(--font-serif, serif)"
        fontSize="14"
        fontWeight="600"
        fill="currentColor"
      >
        N
      </text>
    </svg>
  );
}
