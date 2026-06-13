"use client";

import { type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

export type PraxisButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type PraxisButtonSize = "sm" | "md" | "lg";

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

const SIZE_OVERRIDE: Record<PraxisButtonSize, string> = {
  sm: "!px-4 !py-2.5 !text-[13px] !gap-1.5",
  md: "",
  lg: "!px-10 !py-4 !text-base",
};

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
  const variantClass = VARIANT_CLASS[variant];
  const sizeClass = SIZE_OVERRIDE[size];
  const isActuallyDisabled = isDisabled || isLoading || disabled;

  return (
    <motion.button
      {...props}
      type={type}
      disabled={isActuallyDisabled}
      aria-busy={isLoading || undefined}
      whileTap={isActuallyDisabled ? {} : { scale: 0.97 }}
      transition={{ duration: 0.12, ease: [0.25, 1, 0.5, 1] }}
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
