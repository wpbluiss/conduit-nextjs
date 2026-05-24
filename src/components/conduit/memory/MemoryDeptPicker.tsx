"use client";

import { EMPLOYEE_ORDER, EMPLOYEES, type EmployeeId } from "@/lib/conduit/employees";

interface Props {
  value: EmployeeId[];
  onChange: (next: EmployeeId[]) => void;
}

/**
 * Multi-select dept chips with an "Everyone" toggle that clears all
 * dept selections (= global). Empty array = global.
 */
export function MemoryDeptPicker({ value, onChange }: Props) {
  const isGlobal = value.length === 0;

  const toggleDept = (id: EmployeeId) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const setGlobal = () => onChange([]);

  return (
    <div className="memory-dept-picker">
      <div className="memory-dept-picker-row">
        <button
          type="button"
          onClick={setGlobal}
          className="memory-dept-chip memory-dept-chip-everyone"
          data-active={isGlobal || undefined}
          title="Visible to every employee"
        >
          Everyone
        </button>
      </div>
      <div className="memory-dept-picker-row">
        {EMPLOYEE_ORDER.map((id) => {
          const meta = EMPLOYEES[id];
          const active = value.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggleDept(id)}
              className="memory-dept-chip"
              data-active={active || undefined}
              data-dept={id}
              style={
                {
                  // Surface the dept color into a local CSS var the chip CSS reads.
                  ["--dept-color" as string]: meta.color,
                } as React.CSSProperties
              }
              title={`${meta.name} only`}
            >
              {meta.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
