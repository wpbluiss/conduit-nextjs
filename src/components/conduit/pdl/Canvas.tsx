// pdl — Canvas
// Contract: specs/praxis-design-language/contracts/foundations.md §2.9
//
// Wraps the .pdl-canvas-grid utility — dotted-grid background that
// provides absolute positioning context for Node and Edge children.
// No pan/zoom in v1 (Memory canvas Slice 1).

import type { CSSProperties, ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** 1 = standard (subtle dots), 2 = strong (higher-contrast dots). */
  density?: 1 | 2;
  className?: string;
  style?: CSSProperties;
}

export function Canvas({
  children,
  density = 1,
  className,
  style,
}: Props) {
  return (
    <div
      className={`pdl-canvas-grid${className ? ` ${className}` : ""}`}
      data-strong={density === 2 ? "true" : undefined}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
