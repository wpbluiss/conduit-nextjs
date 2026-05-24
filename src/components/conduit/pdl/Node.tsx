// pdl — Node
// Contract: specs/praxis-design-language/contracts/foundations.md §2.10
//
// Circular surface for the graph. Absolutely positioned at {x, y}
// (translate(-50%, -50%) centers on the point). Hover glow uses the
// `tone` CSS color (typically a dept jewel-tone) or falls back to the
// accent glow. Ambient pulse on idle, reduced-motion gated.

import type { CSSProperties, ReactNode } from "react";

interface Props {
  position: { x: number; y: number };
  size?: number;
  /** CSS color (e.g. var(--pdl-dept-marketing)); null for neutral. */
  tone?: string | null;
  state?: "idle" | "hover" | "active";
  children?: ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  ariaLabel?: string;
  className?: string;
}

export function Node({
  position,
  size = 48,
  tone,
  state = "idle",
  children,
  onClick,
  ariaLabel,
  className,
}: Props) {
  const style: CSSProperties = {
    left: position.x,
    top: position.y,
    width: size,
    height: size,
  };
  if (tone) {
    (style as React.CSSProperties & Record<string, string>)["--pdl-tone"] =
      tone;
  }
  return (
    <button
      type="button"
      className={`pdl-node${className ? ` ${className}` : ""}`}
      data-state={state}
      onClick={onClick}
      aria-label={ariaLabel}
      style={style}
    >
      {children}
    </button>
  );
}
