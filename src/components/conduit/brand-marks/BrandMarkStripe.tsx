// PLACEHOLDER MARK — simplified geometric form.
// Swap to licensed/official brand asset before public release.

interface Props {
  size?: number;
  className?: string;
}

export function BrandMarkStripe({ size = 24, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="3" fill="#635BFF" />
      <text
        x="12"
        y="17"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui"
        fontSize="14"
        fontWeight="700"
        fill="#FFFFFF"
        fontStyle="italic"
      >
        S
      </text>
    </svg>
  );
}
