import Image from "next/image";

interface Props {
  size?: number;
  withWordmark?: boolean;
  className?: string;
  /** Adds a soft outer glow via the `.praxis-mark` filter token. */
  glow?: boolean;
}

// Natural aspect of the cleaned mark (632x961 → ~0.658 W/H).
const MARK_ASPECT = 632 / 961;

export function PraxisLogo({
  size = 22,
  withWordmark = false,
  className = "",
  glow = false,
}: Props) {
  const height = size;
  const width = Math.round(size * MARK_ASPECT);
  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      aria-label="Praxis"
    >
      <Image
        src="/praxis-mark.png"
        alt=""
        width={width}
        height={height}
        priority
        sizes={`${width}px`}
        className={glow ? "praxis-mark" : undefined}
        style={{ display: "block", width, height }}
      />
      {withWordmark && (
        <span
          className="serif text-[var(--color-text)]"
          style={{ fontSize: Math.round(size * 0.95), lineHeight: 1 }}
        >
          Praxis
        </span>
      )}
    </span>
  );
}
