"use client";

// pdl — Button
// Contract: specs/praxis-design-language/contracts/foundations.md §2.x
//
// Premium button system with framer-motion micro-interactions.
// Five variants × three sizes. Fully accessible (focus-visible rings,
// ARIA-disabled on loading). Ember/PDL identity.

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

export type ButtonVariant =
  | "primary"    // ember accent fill — primary action
  | "secondary"  // subtle bordered — secondary action
  | "ghost"      // transparent — tertiary / in-context
  | "danger"     // destructive confirm
  | "ember-cta"; // high-contrast marketing CTA (warm on black)

export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Icon slotted before the label */
  icon?: ReactNode;
  children?: ReactNode;
  fullWidth?: boolean;
}

// Per-variant static styles (no Tailwind — uses existing PDL CSS vars)
const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-[oklch(58%_0.22_290)] text-white border border-transparent hover:bg-[oklch(62%_0.22_290)] active:bg-[oklch(54%_0.22_290)]" +
    " focus-visible:ring-2 focus-visible:ring-[oklch(58%_0.22_290)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pdl-canvas,#0A0815)]" +
    " shadow-[0_0_20px_oklch(58%_0.22_290/0.35)]",
  secondary:
    "bg-transparent text-[var(--pdl-text,#F5F1EA)] border border-[var(--pdl-border-default,rgba(245,241,234,0.14))]" +
    " hover:border-[var(--pdl-border-strong,rgba(245,241,234,0.22))] hover:bg-[var(--pdl-surface-raised,#1A152F)]" +
    " focus-visible:ring-2 focus-visible:ring-[var(--pdl-border-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pdl-canvas,#0A0815)]" +
    " active:bg-[var(--pdl-surface,#131027)]",
  ghost:
    "bg-transparent text-[var(--pdl-text-muted,#8A88A4)] border border-transparent" +
    " hover:text-[var(--pdl-text,#F5F1EA)] hover:bg-[var(--pdl-surface-raised,#1A152F)]" +
    " focus-visible:ring-2 focus-visible:ring-[var(--pdl-border-default)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pdl-canvas,#0A0815)]" +
    " active:bg-[var(--pdl-surface,#131027)]",
  danger:
    "bg-transparent text-[#F87171] border border-[rgba(248,113,113,0.25)]" +
    " hover:bg-[rgba(248,113,113,0.08)] hover:border-[rgba(248,113,113,0.4)]" +
    " focus-visible:ring-2 focus-visible:ring-[#F87171] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pdl-canvas,#0A0815)]" +
    " active:bg-[rgba(248,113,113,0.12)]",
  "ember-cta":
    "bg-[#FF6B2C] text-white border border-transparent hover:bg-[#FF7E44] active:bg-[#E55A1F]" +
    " focus-visible:ring-2 focus-visible:ring-[#FF6B2C] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pdl-canvas,#0A0815)]" +
    " shadow-[0_0_32px_rgba(255,107,44,0.40)]",
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
  md: "h-10 px-5 text-sm rounded-xl gap-2",
  lg: "h-12 px-7 text-base rounded-xl gap-2.5",
};

// Spinner for loading state
function Spinner({ size }: { size: ButtonSize }) {
  const dim = size === "sm" ? 12 : size === "lg" ? 18 : 15;
  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="animate-spin"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="30 100"
      />
    </svg>
  );
}

// The tap animation props — subtle depth + lift
const tapAnimation: Pick<
  HTMLMotionProps<"button">,
  "whileHover" | "whileTap" | "transition"
> = {
  whileHover: { scale: 1.015, y: -1 },
  whileTap: { scale: 0.97, y: 0 },
  transition: { type: "spring", stiffness: 500, damping: 30 },
};

export const PraxisButton = forwardRef<HTMLButtonElement, ButtonProps>(
  function PraxisButton(
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      children,
      fullWidth = false,
      disabled,
      className = "",
      ...props
    },
    ref,
  ) {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        {...(tapAnimation as object)}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        className={[
          // Base
          "inline-flex items-center justify-center font-medium tracking-[-0.01em]",
          "transition-colors duration-150 outline-none",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          // Variant + size
          VARIANT_STYLES[variant],
          SIZE_STYLES[size],
          // Width
          fullWidth ? "w-full" : "",
          // Consumer overrides
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...(props as HTMLMotionProps<"button">)}
      >
        {loading ? (
          <Spinner size={size} />
        ) : icon ? (
          <span aria-hidden="true">{icon}</span>
        ) : null}
        {children}
      </motion.button>
    );
  },
);
