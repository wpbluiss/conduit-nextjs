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

/* Spec: 120–220ms, easing [0.22,1,0.36,1] "snappy spring" */
const SPRING = { duration: 0.15, ease: [0.22, 1, 0.36, 1] as const };

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
      /* Hover lift — CSS handles bg/border/shadow, framer-motion handles transform */
      whileHover={isActuallyDisabled || prefersReduced ? undefined : { y: -1 }}
      /* Press: scale down + snap back to y=0 (overrides hover lift) */
      whileTap={isActuallyDisabled || prefersReduced ? undefined : { scale: 0.97, y: 0 }}
      transition={SPRING}
      className={`${variantClass} ${sizeClass} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading && <SpinnerIcon />}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          opacity: isLoading ? 0.65 : 1,
          transition: "opacity 0.2s ease-out",
        }}
      >
        {isLoading && loadingText ? loadingText : children}
      </span>
    </motion.button>
  );
}
