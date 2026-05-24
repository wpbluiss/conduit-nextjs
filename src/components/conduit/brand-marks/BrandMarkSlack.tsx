// PLACEHOLDER MARK — simplified geometric form.
// Swap to licensed/official brand asset before public release.

interface Props {
  size?: number;
  className?: string;
}

export function BrandMarkSlack({ size = 24, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect x="4" y="9" width="6" height="3" rx="1.5" fill="#E01E5A" />
      <rect x="14" y="12" width="6" height="3" rx="1.5" fill="#2EB67D" />
      <rect x="9" y="4" width="3" height="6" rx="1.5" fill="#ECB22E" />
      <rect x="12" y="14" width="3" height="6" rx="1.5" fill="#36C5F0" />
    </svg>
  );
}
