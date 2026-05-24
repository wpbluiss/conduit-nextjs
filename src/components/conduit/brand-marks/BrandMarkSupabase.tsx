// PLACEHOLDER MARK — simplified geometric form.
// Swap to licensed/official brand asset before public release.

interface Props {
  size?: number;
  className?: string;
}

export function BrandMarkSupabase({ size = 24, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M13 2 L4 14 L11 14 L11 22 L20 10 L13 10 Z"
        fill="#3ECF8E"
        stroke="#2BA970"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
