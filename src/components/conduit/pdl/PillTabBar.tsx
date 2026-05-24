"use client";

// pdl — PillTabBar
// Contract: specs/praxis-design-language/contracts/foundations.md §2.12
//
// 2-3 pill tabs per surface. Active pill fills with accent; inactive
// shows muted text. Spec rule: never more than 3 tabs — enforce at
// consumer level (this primitive accepts any count but warns).

import type { ReactNode } from "react";

interface Tab<T extends string> {
  id: T;
  label: string;
  icon?: ReactNode;
}

interface Props<T extends string> {
  tabs: Tab<T>[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
}

export function PillTabBar<T extends string>({
  tabs,
  active,
  onChange,
  className,
}: Props<T>) {
  if (tabs.length > 3 && typeof console !== "undefined") {
    console.warn(
      `[PillTabBar] ${tabs.length} tabs exceeds the design-language max of 3. ` +
        `Consider consolidating.`,
    );
  }
  return (
    <div
      className={`pdl-pill-tabs pdl-glass${className ? ` ${className}` : ""}`}
      role="tablist"
    >
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.id)}
            className="pdl-pill-tab"
            data-active={isActive || undefined}
          >
            {t.icon}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
