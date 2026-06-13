"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";

export type PraxisButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface PraxisButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  isDisabled?: boolean;
  variant?: PraxisButtonVariant;
}

const VARIANT_CLASS: Record<PraxisButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
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
  className = "",
  disabled,
  type = "button",
  ...props
}: PraxisButtonProps) {
  const variantClass = VARIANT_CLASS[variant];
  const isActuallyDisabled = isDisabled || isLoading || disabled;

  return (
    <button
      {...props}
      type={type}
      disabled={isActuallyDisabled}
      aria-busy={isLoading || undefined}
      className={`${variantClass} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
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
    </button>
  );
}
