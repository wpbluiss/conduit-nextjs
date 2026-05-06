import type { EmployeeKey } from "@/lib/ai/provider";
import { EMPLOYEES } from "@/lib/conduit/employees";

// Re-exported as Records for compatibility with existing call sites that
// indexed by EmployeeKey directly.
export const DEPT_COLOR: Record<EmployeeKey, string> = Object.fromEntries(
  Object.entries(EMPLOYEES).map(([id, c]) => [id, c.color]),
) as Record<EmployeeKey, string>;

export const DEPT_COLOR_SOFT: Record<EmployeeKey, string> = Object.fromEntries(
  Object.entries(EMPLOYEES).map(([id, c]) => [id, c.colorSoft]),
) as Record<EmployeeKey, string>;

export function EmployeeAvatar({
  employee,
  size = 28,
  active = false,
}: {
  employee: EmployeeKey;
  size?: number;
  active?: boolean;
}) {
  const m = EMPLOYEES[employee];
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        background: m.colorSoft,
        ["--dept" as string]: m.color,
        boxShadow: `inset 0 0 0 1.5px ${m.color}`,
      }}
      className={`relative inline-flex items-center justify-center rounded-full text-[11px] font-medium text-[var(--color-text)] ${
        active ? "employee-pulse" : ""
      }`}
    >
      {m.initial}
    </span>
  );
}

export function EmployeeBadge({
  employee,
  withRole = false,
}: {
  employee: EmployeeKey;
  withRole?: boolean;
}) {
  const m = EMPLOYEES[employee];
  return (
    <div className="inline-flex items-center gap-2 relative">
      <EmployeeAvatar employee={employee} size={26} />
      <span className="leading-tight">
        <span
          className="block text-[12px] font-medium tracking-tight"
          style={{ color: m.color }}
        >
          {m.name}
        </span>
        {withRole && (
          <span className="block text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            {m.role}
          </span>
        )}
      </span>
    </div>
  );
}

export function employeeLabel(employee: EmployeeKey): string {
  return EMPLOYEES[employee].name;
}

export function employeeRole(employee: EmployeeKey): string {
  return EMPLOYEES[employee].role;
}
