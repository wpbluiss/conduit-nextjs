// PLACEHOLDER MARK — simplified geometric form.
// Swap to licensed/official brand asset before public release.

interface Props {
  size?: number;
  className?: string;
}

export function BrandMarkDrive({ size = 24, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <polygon points="8,3 16,3 22,14 18,21 6,21 2,14" fill="#FFFFFF" stroke="var(--pdl-border-default)" strokeWidth="0.5" />
      <polygon points="8,3 16,3 12,11" fill="#4285F4" />
      <polygon points="16,3 22,14 18,11" fill="#34A853" />
      <polygon points="2,14 6,21 12,11" fill="#FBBC04" />
    </svg>
  );
}
