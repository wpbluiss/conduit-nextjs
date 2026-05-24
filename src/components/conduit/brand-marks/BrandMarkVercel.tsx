// PLACEHOLDER MARK — simplified geometric form.
// Swap to licensed/official brand asset before public release.
// Theme-aware: ink color flips between modes.

interface Props {
  size?: number;
  className?: string;
}

export function BrandMarkVercel({ size = 24, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <polygon points="12,4 22,20 2,20" fill="currentColor" />
    </svg>
  );
}
