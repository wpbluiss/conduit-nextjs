"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";

interface PraxisButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  isLoading?: boolean;
  isDisabled?: boolean;
  variant?: "primary" | "secondary";
}

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
  isDisabled = false,
  variant = "primary",
  className = "",
  disabled,
  type = "button",
  ...props
}: PraxisButtonProps) {
  const variantClass = variant === "primary" ? "btn-primary" : "btn-secondary";
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
          opacity: isLoading ? 0.55 : 1,
          transition: "opacity 0.3s ease-out",
        }}
      >
        {children}
      </span>
    </button>
  );
}
