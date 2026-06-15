"use client";

// On-brand SVG illustration for the specialist empty state (issue #755).
// Uses currentColor throughout so the accent color is controlled by the wrapper.

import type { EmployeeId } from "@/lib/conduit/employees";
import { EMPLOYEES } from "@/lib/conduit/employees";
import { EMPLOYEE_ICON } from "@/components/conduit/EmployeeBadge";

interface Props {
  employeeId: EmployeeId;
  /** Canvas width in px; height is derived at 0.8 ratio. */
  size?: number;
}

export function SpecialistEmptyArt({ employeeId, size = 220 }: Props) {
  const emp = EMPLOYEES[employeeId];
  const Icon = EMPLOYEE_ICON[employeeId];
  const h = Math.round(size * 0.8);
  const cx = size / 2;
  const cy = h / 2;

  // Dot positions on orbit rings
  const outerDots = [30, 90, 150, 210, 270, 330];
  const midDots = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <figure
      aria-hidden
      style={{
        position: "relative",
        width: size,
        height: h,
        margin: "0 auto",
        // Sets currentColor for all SVG strokes/fills below
        color: emp.color,
      }}
    >
      {/* Abstract orbital SVG backdrop */}
      <svg
        width={size}
        height={h}
        viewBox={`0 0 ${size} ${h}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
        aria-hidden
      >
        {/* outer aura ring */}
        <circle
          cx={cx}
          cy={cy}
          r={size * 0.38}
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.10}
        />
        {/* middle orbit ring */}
        <circle
          cx={cx}
          cy={cy}
          r={size * 0.28}
          stroke="currentColor"
          strokeWidth={1.25}
          opacity={0.16}
          strokeDasharray={`${size * 0.04} ${size * 0.02}`}
        />
        {/* inner ring */}
        <circle
          cx={cx}
          cy={cy}
          r={size * 0.20}
          stroke="currentColor"
          strokeWidth={1.5}
          opacity={0.22}
        />

        {/* central glow fill */}
        <circle
          cx={cx}
          cy={cy}
          r={size * 0.145}
          fill="currentColor"
          opacity={0.08}
        />

        {/* quiet crosshair axes */}
        <line
          x1={cx - size * 0.38}
          y1={cy}
          x2={cx + size * 0.38}
          y2={cy}
          stroke="currentColor"
          strokeWidth={0.5}
          opacity={0.07}
        />
        <line
          x1={cx}
          y1={cy - h * 0.45}
          x2={cx}
          y2={cy + h * 0.45}
          stroke="currentColor"
          strokeWidth={0.5}
          opacity={0.07}
        />

        {/* dots on the middle orbit */}
        {midDots.map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const r = size * 0.28;
          return (
            <circle
              key={`mid-${deg}`}
              cx={cx + r * Math.cos(rad)}
              cy={cy + r * Math.sin(rad)}
              r={size * 0.013}
              fill="currentColor"
              opacity={i % 2 === 0 ? 0.60 : 0.28}
            />
          );
        })}

        {/* dots on the outer orbit */}
        {outerDots.map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const r = size * 0.38;
          return (
            <circle
              key={`outer-${deg}`}
              cx={cx + r * Math.cos(rad)}
              cy={cy + r * Math.sin(rad)}
              r={size * 0.009}
              fill="currentColor"
              opacity={0.28}
            />
          );
        })}

        {/* spoke lines from inner ring to 4 cardinal mid-ring dots */}
        {[0, 90, 180, 270].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const r1 = size * 0.145;
          const r2 = size * 0.28;
          return (
            <line
              key={`spoke-${deg}`}
              x1={cx + r1 * Math.cos(rad)}
              y1={cy + r1 * Math.sin(rad)}
              x2={cx + r2 * Math.cos(rad)}
              y2={cy + r2 * Math.sin(rad)}
              stroke="currentColor"
              strokeWidth={0.75}
              opacity={0.18}
            />
          );
        })}
      </svg>

      {/* Specialist icon centered over the SVG */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            width: size * 0.22,
            height: size * 0.22,
            borderRadius: "var(--radius-xl, 1.25rem)",
            background: emp.colorSoft,
            border: `1.5px solid color-mix(in srgb, ${emp.color} 28%, transparent)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 ${Math.round(size * 0.12)}px color-mix(in srgb, ${emp.color} 18%, transparent)`,
          }}
        >
          <Icon
            size={Math.round(size * 0.1)}
            strokeWidth={2}
            style={{ color: emp.color }}
          />
        </span>
      </div>
    </figure>
  );
}
