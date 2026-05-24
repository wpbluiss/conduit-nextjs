// PLACEHOLDER MARK — simplified geometric form.
// Swap to licensed/official brand asset before public release.

interface Props {
  size?: number;
  className?: string;
}

export function BrandMarkWhatsapp({ size = 24, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" fill="#25D366" />
      <path
        d="M8 9 Q8 8 9 8 L10 8 Q11 8 11 9 L11 10 Q11 11 10 11 Q11 13 13 14 Q13 13 14 13 L15 13 Q16 13 16 14 L16 15 Q16 16 15 16 Q11 16 8 13 Q8 11 8 9 Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}
