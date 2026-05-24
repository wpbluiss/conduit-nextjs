// PLACEHOLDER MARK — simplified geometric form.
// Swap to licensed/official brand asset before public release.

interface Props {
  size?: number;
  className?: string;
}

export function BrandMarkGmail({ size = 24, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect x="2" y="5" width="20" height="14" rx="2" fill="#EA4335" />
      <path d="M2 5 L12 13 L22 5" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
    </svg>
  );
}
