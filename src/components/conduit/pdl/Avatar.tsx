// pdl — Avatar
// Contract: specs/praxis-design-language/contracts/foundations.md §2.3
//
// Circular surface containing a DeptIcon (employee variant) or a
// BrandChip (brand variant). NEVER falls back to text-initials — the
// "letter-initial in colored circle" pattern is explicitly forbidden
// by Principle P1 of the design language.

import type { EmployeeKey } from "@/lib/ai/provider";
import { EMPLOYEES } from "@/lib/conduit/employees";
import type { EmployeeId } from "@/lib/conduit/employees";
import { DeptIcon } from "./DeptIcon";
import type { BrandKind } from "@/components/conduit/brand-marks";
import { BRAND_MARKS } from "@/components/conduit/brand-marks";

type Size = "sm" | "md" | "lg" | "xl";

type Props =
  | {
      variant: "employee";
      employee: EmployeeKey;
      brand?: never;
      size?: Size;
      className?: string;
    }
  | {
      variant: "brand";
      brand: BrandKind;
      employee?: never;
      size?: Size;
      className?: string;
    };

const INNER_PCT: Record<Size, number> = {
  sm: 0.55,
  md: 0.55,
  lg: 0.55,
  xl: 0.55,
};

const PX: Record<Size, number> = {
  sm: 20,
  md: 32,
  lg: 48,
  xl: 72,
};

export function Avatar(props: Props) {
  const size = props.size ?? "md";
  const innerPx = Math.round(PX[size] * INNER_PCT[size]);

  if (props.variant === "employee") {
    const meta = EMPLOYEES[props.employee as EmployeeId];
    return (
      <span
        className={`pdl-avatar${props.className ? ` ${props.className}` : ""}`}
        data-size={size}
        data-dept={props.employee}
        role="img"
        aria-label={meta ? meta.name : props.employee}
        style={
          meta
            ? ({ ["--dept" as string]: meta.color } as React.CSSProperties)
            : undefined
        }
      >
        <DeptIcon employee={props.employee} size={innerPx} />
      </span>
    );
  }

  const Mark = BRAND_MARKS[props.brand];
  return (
    <span
      className={`pdl-avatar${props.className ? ` ${props.className}` : ""}`}
      data-size={size}
      data-brand={props.brand}
      role="img"
      aria-label={props.brand}
    >
      <Mark size={innerPx} />
    </span>
  );
}
