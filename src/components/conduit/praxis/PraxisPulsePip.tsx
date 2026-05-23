import type { EmployeeId } from "@/lib/conduit/employees";
import { EMPLOYEES } from "@/lib/conduit/employees";

interface Props {
  employee: EmployeeId;
  state?: "ambient" | "streaming" | "rest";
  size?: 6 | 8;
  ariaLabel?: string;
}

/**
 * Standalone status pip — smaller surface than PraxisAvatar, same
 * cadence semantics. Per contracts/primitives.md P-003.
 *
 * Used in card corners, sidebar rows, KPI tile chips.
 */
export function PraxisPulsePip({
  employee,
  state = "ambient",
  size = 8,
  ariaLabel,
}: Props) {
  const meta = EMPLOYEES[employee];
  return (
    <span
      className="praxis-pulse-pip"
      data-dept={employee}
      data-state={state === "rest" ? undefined : state}
      data-size={size === 6 ? "6" : undefined}
      aria-label={ariaLabel ?? `${meta.name} status`}
    />
  );
}
