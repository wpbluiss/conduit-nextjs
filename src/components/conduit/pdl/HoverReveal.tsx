// pdl — HoverReveal
// Contract: specs/praxis-design-language/contracts/foundations.md §2.4
//
// Utility wrapper that hides children by default (visibility + opacity
// via .pdl-hover-reveal class) and reveals them on PARENT hover. The
// parent must expose :hover via being non-static-positioned or having
// its own hover styles — consumers wrap a card / node with their own
// hover trigger and place <HoverReveal> as a CHILD.
//
// Reduced-motion and touch-device behavior live in praxis-design-language.css.

import type { CSSProperties, ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Force-visible bypass — useful for testing or always-on contexts. */
  forceVisible?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function HoverReveal({
  children,
  forceVisible,
  className,
  style,
}: Props) {
  return (
    <span
      className={`pdl-hover-reveal${className ? ` ${className}` : ""}`}
      data-force-visible={forceVisible || undefined}
      style={style}
    >
      {children}
    </span>
  );
}
