"use client";

import { EmployeeAvatar } from "./EmployeeBadge";
import { DEPT_COLOR } from "./EmployeeBadge";
import type { EmployeeKey } from "@/lib/ai/provider";

export function TypingIndicator({ employee }: { employee: EmployeeKey }) {
  return (
    <div
      className="flex gap-3"
      style={{ ["--dept" as string]: DEPT_COLOR[employee] }}
    >
      <div className="pt-1 shrink-0">
        <EmployeeAvatar employee={employee} size={32} active />
      </div>
      <div className="min-w-0 flex-1">
        <div
          role="status"
          aria-live="polite"
          aria-label="Praxis is responding"
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
