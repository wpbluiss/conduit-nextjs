"use client";

import { Compass } from "lucide-react";
import type { EmployeeKey } from "@/lib/ai/provider";
import { DEPT_COLOR, DEPT_COLOR_SOFT, EMPLOYEE_ICON } from "./EmployeeBadge";
import { SPECIALIST_ICON_STROKE } from "@/lib/ui/specialist-icons";
import { RewardBurst } from "./RewardBurst";

interface BuiltinProps {
  employee: EmployeeKey;
  name?: never;
  color?: never;
}

interface CustomProps {
  employee?: never;
  /** Display name — initials are derived from the first two words */
  name: string;
  /** Background/icon color override. Defaults to the electric violet accent. */
  color?: string;
}

export type SpecialistAvatarProps = (BuiltinProps | CustomProps) & {
  /** Avatar box size in px. Default 32. */
  size?: number;
  /** Selected/active state — applies accent tint bg + bright accent icon color. */
  active?: boolean;
  /** Streaming/thinking pulse — applies the employeePulse animation. */
  streaming?: boolean;
  /** Reward beat — brief green ring pulse + spark burst on specialist turn completion. */
  rewarded?: boolean;
  className?: string;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/**
 * Unified specialist avatar for the sidebar roster, pin picker, and chat
 * message attribution row. Handles both built-in specialists (role icon) and
 * custom specialists (initials). All instances share the same 8px-radius shape.
 *
 * Active state = electric violet accent (overrides dept color).
 * Streaming state = slow pulse animation while the specialist is generating.
 */
export function SpecialistAvatar({
  employee,
  name,
  color,
  size = 32,
  active = false,
  streaming = false,
  rewarded = false,
  className = "",
}: SpecialistAvatarProps) {
  const isBuiltin = employee !== undefined;

  const deptColor = isBuiltin
    ? DEPT_COLOR[employee!]
    : (color ?? "var(--cx-accent)");
  const deptColorSoft = isBuiltin
    ? DEPT_COLOR_SOFT[employee!]
    : (color ? `color-mix(in srgb, ${color} 12%, transparent)` : "var(--cx-accent-tint)");

  const bg = active
    ? "var(--cx-accent-tint)"
    : deptColorSoft;
  const iconColor = active
    ? "var(--cx-accent-bright)"
    : deptColor;
  const shadow = active
    ? "inset 0 0 0 1.5px var(--cx-accent)"
    : `inset 0 0 0 1.5px color-mix(in srgb, ${deptColor} 55%, transparent)`;

  const radius = Math.round(size * 0.25); // 8px at size=32, scales proportionally
  const glyphSize = Math.max(10, Math.round(size * 0.44)); // 14px at size=32
  const fontSize = Math.max(9, Math.round(size * 0.37));    // 12px at size=32

  const Icon = isBuiltin ? (EMPLOYEE_ICON[employee!] ?? Compass) : null;

  return (
    <span
      aria-hidden
      className={`relative inline-flex items-center justify-center shrink-0 select-none${streaming ? " employee-pulse" : ""}${className ? ` ${className}` : ""}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: bg,
        color: iconColor,
        boxShadow: shadow,
      }}
    >
      {isBuiltin && Icon ? (
        <Icon size={glyphSize} strokeWidth={SPECIALIST_ICON_STROKE} />
      ) : (
        <span
          className="font-semibold leading-none"
          style={{ fontSize, letterSpacing: "-0.01em" }}
        >
          {initials(name ?? "?")}
        </span>
      )}

      {/* Reward beat — delegates to RewardBurst (handles reduced-motion internally) */}
      <RewardBurst rewarded={rewarded} size={size} />
    </span>
  );
}
