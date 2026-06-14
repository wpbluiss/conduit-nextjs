"use client";

import { EmployeeAvatar, DEPT_COLOR, employeeLabel } from "./EmployeeBadge";
import type { EmployeeKey } from "@/lib/ai/provider";

export function TypingIndicator({ employee }: { employee: EmployeeKey }) {
  const name = employeeLabel(employee);
  return (
    <div
      className="flex gap-3"
      style={{ ["--dept" as string]: DEPT_COLOR[employee] }}
    >
      <div className="pt-1 shrink-0">
        <EmployeeAvatar employee={employee} size={32} active />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <span
          className="text-[12px] font-medium"
          style={{ color: DEPT_COLOR[employee] }}
        >
          {name}
        </span>
        <div
          role="status"
          aria-live="polite"
          aria-label={`${name} is responding`}
          className="conduit-bubble-assistant inline-flex items-center gap-1 px-4 py-3"
        >
          <span className="typing-dot" aria-hidden="true" />
          <span className="typing-dot" aria-hidden="true" />
          <span className="typing-dot" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
