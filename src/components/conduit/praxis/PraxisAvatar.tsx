import type { EmployeeId } from "@/lib/conduit/employees";
import { EMPLOYEES } from "@/lib/conduit/employees";
import { EMPLOYEE_ICON } from "@/components/conduit/EmployeeBadge";

export type PraxisAvatarSize = "sm" | "md" | "lg" | "xl" | "2xl";
export type PraxisAvatarPulse = "ambient" | "streaming" | "celebration";

interface Props {
  employee: EmployeeId;
  size?: PraxisAvatarSize;
  pulse?: PraxisAvatarPulse;
  ghosted?: boolean;
  ariaLabel?: string;
  /** Optional inline style passthrough (e.g. for view-transition-name). */
  style?: React.CSSProperties;
}

/**
 * Server-safe employee chip. The CSS class .praxis-avatar (and the
 * .praxis-avatar-atlas / .praxis-avatar-ghosted modifiers) does all
 * the visual work; this component just wires data-* attributes.
 *
 * Per contracts/primitives.md P-002. Atlas (jarvis) gets the
 * spine-variant chrome automatically.
 */
export function PraxisAvatar({
  employee,
  size = "md",
  pulse,
  ghosted = false,
  ariaLabel,
  style,
}: Props) {
  const meta = EMPLOYEES[employee];
  const Icon = EMPLOYEE_ICON[employee];
  // Atlas gets a minimum size of lg for spine prominence.
  const effectiveSize: PraxisAvatarSize =
    employee === "jarvis" && size === "sm"
      ? "lg"
      : employee === "jarvis" && size === "md"
      ? "lg"
      : size;
  const sizePx =
    effectiveSize === "sm" ? 20
    : effectiveSize === "md" ? 24
    : effectiveSize === "lg" ? 28
    : effectiveSize === "xl" ? 32
    : 56;
  const glyphSize = Math.max(10, Math.round(sizePx * 0.5));

  const classes = [
    "praxis-avatar",
    employee === "jarvis" ? "praxis-avatar-atlas" : "",
    ghosted ? "praxis-avatar-ghosted" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={classes}
      data-dept={employee}
      data-size={effectiveSize}
      data-pulse={pulse}
      aria-label={ariaLabel ?? `${meta.name}, ${meta.role}`}
      style={style}
    >
      <Icon size={glyphSize} strokeWidth={2.25} aria-hidden />
    </span>
  );
}
