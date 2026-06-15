"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

export type PraxisButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type PraxisButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

interface PraxisButtonProps extends HTMLMotionProps<"button"> {
  children: ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  isDisabled?: boolean;
  variant?: PraxisButtonVariant;
  size?: PraxisButtonSize;
}

const VARIANT_CLASS: Record<PraxisButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

const SIZE_CLASS: Record<PraxisButtonSize, string> = {
  sm: "btn-sz-sm",
  md: "btn-sz-md",
  lg: "btn-sz-lg",
  icon: "btn-sz-icon",
  "icon-sm": "btn-sz-icon-sm",
};

/*
 * Press transition: fast spring that physically collapses on tap and
 * rebounds with a touch of overshoot on release — the "Apple button" feel.
 * stiffness/damping tuned for snappy <120ms press, springy ~200ms release.
 */
const PRESS_SPRING = {
  type: "spring" as const,
  stiffness: 500,
  damping: 30,
  mass: 0.8,
};

/* Hover lift — subtle, sub-100ms, eased */
const HOVER_EASE = { duration: 0.12, ease: [0.22, 1, 0.36, 1] as const };

export function SpinnerIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="animate-spin motion-reduce:animate-none shrink-0"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="30 28"
      />
    </svg>
  );
}

export function PraxisButton({
  children,
  isLoading = false,
  loadingText,
  isDisabled = false,
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  type = "button",
  ...props
}: PraxisButtonProps) {
  const prefersReduced = useReducedMotion();
  const variantClass = VARIANT_CLASS[variant];
  const sizeClass = SIZE_CLASS[size];
  const isActuallyDisabled = isDisabled || isLoading || disabled;

  return (
    <motion.button
      {...props}
      type={type}
      disabled={isActuallyDisabled}
      aria-busy={isLoading || undefined}
      /* Hover: CSS handles bg/border/shadow; framer-motion handles the lift transform */
      whileHover={isActuallyDisabled || prefersReduced ? undefined : { y: -1 }}
      /* Press: scale 0.96 + return to baseline y; springy release on pointer-up */
      whileTap={isActuallyDisabled || prefersReduced ? undefined : { scale: 0.96, y: 0 }}
      /* Per-property: scale gets the spring (tactile snap+rebound); y gets a quick ease (hover lift) */
      transition={prefersReduced ? HOVER_EASE : { scale: PRESS_SPRING, y: HOVER_EASE }}
      className={`${variantClass} ${sizeClass} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {/* Relative wrapper so spinner can overlay without shifting button width */}
      <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        {/* Children always rendered — preserves natural button width during loading */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            opacity: isLoading ? 0 : 1,
            transition: "opacity 0.15s ease-out",
          }}
        >
          {children}
        </span>
        {/* Spinner + optional loading label — absolutely overlaid, zero layout impact */}
        {isLoading && (
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <SpinnerIcon />
            {loadingText && <span>{loadingText}</span>}
          </span>
        )}
      </span>
    </motion.button>
  );
}
