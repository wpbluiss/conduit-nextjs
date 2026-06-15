"use client";

import { Compass } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { EmployeeKey } from "@/lib/ai/provider";
import { DEPT_COLOR, DEPT_COLOR_SOFT, EMPLOYEE_ICON } from "./EmployeeBadge";
import { SPECIALIST_ICON_STROKE } from "@/lib/ui/specialist-icons";

// Spark burst geometry for the reward beat (5 evenly-spaced angles)
const SPARK_ANGLES_DEG = [0, 72, 144, 216, 288];
const SPARK_COLORS = ["#34D399", "#7C6CFF", "#34D399", "#9B8CFF", "#34D399"];

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
  const prefersReducedMotion = useReducedMotion();
  const isBuiltin = employee !== undefined;

  const deptColor = isBuiltin
    ? DEPT_COLOR[employee!]
    : (color ?? "var(--cx-accent, #7C6CFF)");
  const deptColorSoft = isBuiltin
    ? DEPT_COLOR_SOFT[employee!]
    : (color ? `color-mix(in srgb, ${color} 12%, transparent)` : "var(--cx-accent-tint, rgba(124,108,255,0.12))");

  const bg = active
    ? "var(--cx-accent-tint, rgba(124,108,255,0.12))"
    : deptColorSoft;
  const iconColor = active
    ? "var(--cx-accent-bright, #9B8CFF)"
    : deptColor;
  const shadow = active
    ? "inset 0 0 0 1.5px var(--cx-accent, #7C6CFF)"
    : `inset 0 0 0 1.5px color-mix(in srgb, ${deptColor} 55%, transparent)`;

  const radius = Math.round(size * 0.25); // 8px at size=32, scales proportionally
  const glyphSize = Math.max(10, Math.round(size * 0.44)); // 14px at size=32
  const fontSize = Math.max(9, Math.round(size * 0.37));    // 12px at size=32

  const Icon = isBuiltin ? (EMPLOYEE_ICON[employee!] ?? Compass) : null;

  const sparkRadius = Math.round(size * 0.8);

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

      {/* Reward beat — ring pulse + spark burst. Skipped when prefers-reduced-motion. */}
      {!prefersReducedMotion && (
        <AnimatePresence>
          {rewarded && (
            <>
              {/* Expanding ring */}
              <motion.span
                key="reward-ring"
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0.9, scale: 0.85 }}
                animate={{ opacity: 0, scale: 2.2 }}
                exit={{}}
                transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  borderRadius: radius,
                  boxShadow: "0 0 0 2px #34D399",
                }}
              />
              {/* Spark particles */}
              {SPARK_ANGLES_DEG.map((deg, i) => {
                const rad = (deg * Math.PI) / 180;
                const tx = Math.cos(rad) * sparkRadius;
                const ty = Math.sin(rad) * sparkRadius;
                return (
                  <motion.span
                    key={`spark-${i}`}
                    className="absolute pointer-events-none rounded-full"
                    initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                    animate={{ opacity: 0, x: tx, y: ty, scale: 0 }}
                    exit={{}}
                    transition={{
                      duration: 0.42,
                      ease: [0.22, 1, 0.36, 1],
                      delay: i * 0.018,
                    }}
                    style={{
                      width: 4,
                      height: 4,
                      left: "50%",
                      top: "50%",
                      marginLeft: -2,
                      marginTop: -2,
                      background: SPARK_COLORS[i],
                    }}
                  />
                );
              })}
            </>
          )}
        </AnimatePresence>
      )}
    </span>
  );
}
