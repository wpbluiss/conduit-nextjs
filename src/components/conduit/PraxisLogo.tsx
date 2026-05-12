import Image from "next/image";

interface Props {
  size?: number;
  withWordmark?: boolean;
  className?: string;
  /** Adds a soft outer glow via the `.praxis-mark` filter token. */
  glow?: boolean;
}

export function PraxisLogo({
  size = 22,
  withWordmark = false,
  className = "",
  glow = false,
}: Props) {
  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      aria-label="Praxis"
    >
      <Image
        src="/praxis-mark.png"
        alt=""
        width={size}
        height={size}
        priority
        className={glow ? "praxis-mark" : undefined}
        style={{ display: "block", width: size, height: size }}
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
