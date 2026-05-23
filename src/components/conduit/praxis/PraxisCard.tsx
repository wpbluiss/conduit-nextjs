import Link from "next/link";
import type { ReactNode, CSSProperties } from "react";
import type { EmployeeId } from "@/lib/conduit/employees";

export type PraxisCardVariant = "kpi" | "team" | "stat" | "activity";

interface Props {
  variant: PraxisCardVariant;
  dept?: EmployeeId;
  locked?: boolean;
  href?: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  /** Optional inline style (e.g. for view-transition-name on the team card). */
  style?: CSSProperties;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

/**
 * Universal card material. The CSS class .praxis-card (+ variant
 * modifier + data-locked) does all the visual work; this component
 * picks Link vs div based on href, wires data-dept for the cascade
 * utility, and forwards interaction handlers (for hover-tint flow).
 *
 * Per contracts/primitives.md P-001.
 */
export function PraxisCard({
  variant,
  dept,
  locked = false,
  href,
  children,
  className,
  ariaLabel,
  style,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
}: Props) {
  const classes = [
    "praxis-card",
    `praxis-card-${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const isInteractive = Boolean(href);

  const sharedProps = {
    className: classes,
    "data-dept": dept,
    "data-locked": locked || undefined,
    "data-interactive": isInteractive || undefined,
    "aria-label": ariaLabel,
    style,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
  } as const;

  if (href) {
    return (
      <Link href={href} {...sharedProps}>
        {children}
      </Link>
    );
  }
  return <div {...sharedProps}>{children}</div>;
}
