import type { EmployeeKey } from "@/lib/ai/provider";

export const DEPT_COLOR: Record<EmployeeKey, string> = {
  jarvis: "var(--color-dept-jarvis)",
  marketing: "var(--color-dept-marketing)",
  sales: "var(--color-dept-sales)",
  engineering: "var(--color-dept-engineering)",
};

export const DEPT_COLOR_SOFT: Record<EmployeeKey, string> = {
  jarvis: "var(--color-dept-jarvis-soft)",
  marketing: "var(--color-dept-marketing-soft)",
  sales: "var(--color-dept-sales-soft)",
  engineering: "var(--color-dept-engineering-soft)",
};

const META: Record<
  EmployeeKey,
  { initial: string; label: string; role: string }
> = {
  jarvis: { initial: "J", label: "Jarvis", role: "Chief of Staff" },
  marketing: { initial: "M", label: "Marketing", role: "Department" },
  sales: { initial: "S", label: "Sales", role: "Department" },
  engineering: { initial: "E", label: "Engineering", role: "Department" },
};

export function EmployeeAvatar({
  employee,
  size = 28,
  active = false,
}: {
  employee: EmployeeKey;
  size?: number;
  active?: boolean;
}) {
  const m = META[employee];
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        background: DEPT_COLOR_SOFT[employee],
        ["--dept" as string]: DEPT_COLOR[employee],
      }}
      className={`inline-flex items-center justify-center rounded-full text-[11px] font-medium text-[var(--color-text)] ring-1 ${
        active ? "employee-pulse" : ""
      }`}
    >
      <span
        className="absolute"
        aria-hidden
        style={{
          inset: 0,
          borderRadius: 9999,
          boxShadow: `inset 0 0 0 1.5px ${DEPT_COLOR[employee]}`,
        }}
      />
      <span className="relative">{m.initial}</span>
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
  const m = META[employee];
  return (
    <div className="inline-flex items-center gap-2 relative">
      <EmployeeAvatar employee={employee} size={26} />
      <span className="leading-tight">
        <span
          className="block text-[12px] font-medium tracking-tight"
          style={{ color: DEPT_COLOR[employee] }}
        >
          {m.label}
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
  return META[employee].label;
}

export function employeeRole(employee: EmployeeKey): string {
  return META[employee].role;
}
