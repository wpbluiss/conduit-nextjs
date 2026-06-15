"use client";

import { useEffect, useState } from "react";
import { EMPLOYEES, EMPLOYEE_ORDER, type EmployeeId } from "@/lib/conduit/employees";
import { DEPT_COLOR, DEPT_COLOR_SOFT } from "./EmployeeBadge";
import { SpecialistAvatar } from "./SpecialistAvatar";
import type { EmployeeKey } from "@/lib/ai/provider";
import { useNicknames } from "@/context/NicknameContext";
import { Button } from "@/components/conduit/ui/Button";

const STORAGE_KEY = "conduit_specialist_choice_v1";

export function useSpecialistChoice(): {
  hasChosen: boolean | null;
  persist: (id: EmployeeId | "auto") => void;
} {
  const [hasChosen, setHasChosen] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setHasChosen(Boolean(localStorage.getItem(STORAGE_KEY)));
    } catch {
      setHasChosen(true); // fail-safe: don't block the user
    }
  }, []);

  function persist(id: EmployeeId | "auto") {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
    setHasChosen(true);
  }

  return { hasChosen, persist };
}

export function SpecialistSelectorModal({
  allowedEmployees,
  onSelect,
}: {
  allowedEmployees: EmployeeKey[];
  /** Called with the chosen specialist id, or null for "let Atlas decide". */
  onSelect: (specialist: EmployeeKey | null) => void;
}) {
  const [selected, setSelected] = useState<EmployeeId | null>(null);
  const allowedSet = new Set(allowedEmployees);
  const { labelFor } = useNicknames();

  function confirm() {
    onSelect(selected as EmployeeKey | null);
  }

  function skip() {
    onSelect(null);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose your specialist"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
    >
      <div
        className="cx-glass-float cx-glass-border w-full max-w-2xl rounded-[16px] p-6 md:p-8"
        style={{ color: "var(--cx-text)" }}
      >
        <p
          className="cx-type-xs uppercase tracking-[0.2em] mb-2"
          style={{ color: "var(--color-text-muted)" }}
        >
          Your team · First task
        </p>
        <h2
          className="cx-heading-lg md:cx-heading-xl font-semibold mb-1"
          style={{ color: "var(--color-text)" }}
        >
          Who leads this?
        </h2>
        <p
          className="text-sm mb-6"
          style={{ color: "var(--color-text-muted)" }}
        >
          Pick a specialist, or let Atlas route it automatically.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
          {EMPLOYEE_ORDER.map((id) => {
            const m = EMPLOYEES[id];
            const isAllowed = allowedSet.has(id as EmployeeKey);
            const isSelected = selected === id;
            return (
              <button
                key={id}
                type="button"
                disabled={!isAllowed}
                onClick={() => setSelected(isSelected ? null : id)}
                className="flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all"
                style={{
                  background: isSelected
                    ? DEPT_COLOR_SOFT[id as EmployeeKey]
                    : "transparent",
                  borderColor: isSelected
                    ? DEPT_COLOR[id as EmployeeKey]
                    : isAllowed
                      ? "var(--color-border)"
                      : "color-mix(in srgb, var(--color-border) 40%, transparent)",
                  opacity: isAllowed ? 1 : 0.4,
                  cursor: isAllowed ? "pointer" : "not-allowed",
                }}
                aria-pressed={isSelected}
              >
                <SpecialistAvatar employee={id as EmployeeKey} size={28} active={isSelected} />
                <div>
                  <div
                    className="cx-type-sm font-medium leading-tight"
                    style={{ color: isSelected ? DEPT_COLOR[id as EmployeeKey] : "var(--color-text)" }}
                  >
                    {labelFor(id as EmployeeKey)}
                  </div>
                  <div
                    className="cx-type-xs uppercase tracking-[0.14em] mt-0.5"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {m.role}
                  </div>
                </div>
                <p
                  className="cx-type-xs leading-snug hidden sm:block"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {m.tagline}
                </p>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            variant="ghost"
            size="md"
            onClick={skip}
            className="flex-1 justify-center"
          >
            Let Atlas decide
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={confirm}
            isDisabled={!selected}
            className="flex-1 justify-center"
          >
            {selected
              ? `Talk to ${labelFor(selected as EmployeeKey)} →`
              : "Select a specialist first"}
          </Button>
        </div>
      </div>
    </div>
  );
}
