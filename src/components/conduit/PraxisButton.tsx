"use client";

import { forwardRef } from "react";

/** Which visual style to use. Maps to the conduit-btn-* CSS classes. */
type Variant =
  | "primary"         // indigo on light bg
  | "secondary"       // outlined on light bg
  | "primary-inverse" // indigo on dark bg
  | "secondary-inverse" // outlined on dark bg
  | "ghost"           // no bg, text-only; uses secondary styling
  | "danger";         // destructive red variant

interface PraxisButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Show a spinner and disable interaction. Width is preserved. */
  loading?: boolean;
  /** Text shown inside the button while loading (replaces children). */
  loadingText?: string;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "conduit-btn-primary",
  secondary: "conduit-btn-secondary",
  "primary-inverse": "conduit-btn-primary-inverse",
  "secondary-inverse": "conduit-btn-secondary-inverse",
  ghost: "conduit-btn-secondary",
  danger: "conduit-btn-danger",
};

/** 15 px spinner that matches the existing SpinnerIcon in auth forms. */
function Spinner() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="animate-spin shrink-0"
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

/**
 * Branded button component wrapping the `conduit-btn-*` CSS classes.
 * Adds first-class `loading` and `disabled` states with no layout shift.
 *
 * Implements FR: Premium CTAs loading skeleton + disabled button treatment (issue #162).
 */
export const PraxisButton = forwardRef<HTMLButtonElement, PraxisButtonProps>(
  function PraxisButton(
    {
      variant = "primary",
      loading = false,
      loadingText,
      disabled,
      children,
      className = "",
      style,
      ...rest
    },
    ref,
  ) {
    const isDisabled = disabled || loading;
    const variantClass = VARIANT_CLASS[variant] ?? VARIANT_CLASS.primary;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={[
          variantClass,
          isDisabled && !loading ? "opacity-50 cursor-not-allowed" : "",
          loading ? "opacity-80 cursor-wait" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          // Preserve button width during spinner swap so layout never shifts.
          minWidth: "var(--praxis-btn-min-w, auto)",
          ...style,
        }}
        {...rest}
      >
        {loading && <Spinner />}
        <span>{loading && loadingText ? loadingText : children}</span>
      </button>
    );
  },
);
