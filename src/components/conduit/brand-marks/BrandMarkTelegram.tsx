// PLACEHOLDER MARK — simplified geometric form.
// Swap to licensed/official brand asset before public release.

interface Props {
  size?: number;
  className?: string;
}

export function BrandMarkTelegram({ size = 24, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" fill="#229ED9" />
      <path
        d="M6 12 L17 7 L15 17 L11 14 L8 16 L11 14 L6 12 Z"
        fill="#FFFFFF"
        strokeLinejoin="round"
      />
    </svg>
  );
}
