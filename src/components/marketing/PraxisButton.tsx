"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { ComponentProps } from "react";

const EASE = [0.25, 1, 0.5, 1] as const;

// ---------------------------------------------------------------------------
// Variant + size maps
// ---------------------------------------------------------------------------
const variantClasses = {
  primary:
    "bg-[var(--color-indigo-500)] text-white border-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]",
  secondary:
    "bg-transparent text-[var(--color-cream)] border-[var(--color-edge)] hover-secondary",
  ghost:
    "bg-transparent text-[var(--color-cream-mute)] border-transparent",
  danger:
    "bg-[#C0392B] text-white border-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
} as const;

const variantHover = {
  primary: {
    background: "var(--color-indigo-700, #4046c8)",
    boxShadow:
      "0 0 48px rgba(91,99,232,0.40), 0 4px 24px rgba(91,99,232,0.20)",
    y: -1,
  },
  secondary: {
    borderColor: "rgba(91,99,232,0.50)",
    background: "rgba(91,99,232,0.06)",
    y: -1,
  },
  ghost: {
    background: "rgba(255,255,255,0.06)",
    y: -1,
  },
  danger: {
    background: "#9B2335",
    boxShadow: "0 0 32px rgba(192,57,43,0.40)",
    y: -1,
  },
} as const;

const sizeClasses = {
  sm: "h-8 px-4 text-[13px] gap-1.5 rounded-[8px]",
  md: "h-[46px] px-6 text-[15px] gap-2 rounded-[10px]",
  lg: "h-[52px] px-8 text-[16px] gap-2.5 rounded-[12px]",
} as const;

// ---------------------------------------------------------------------------
// Spinner (ember color)
// ---------------------------------------------------------------------------
function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="animate-spin"
      style={{ minWidth: size }}
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path
        d="M8 2a6 6 0 0 1 6 6"
        stroke="#ff8a3d"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Variant = keyof typeof variantClasses;
type Size = keyof typeof sizeClasses;

interface BaseProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

type ButtonProps = BaseProps &
  Omit<ComponentProps<"button">, "size"> & { href?: undefined };

type LinkProps = BaseProps &
  Omit<ComponentProps<typeof Link>, "size"> & { href: string };

type PraxisButtonProps = ButtonProps | LinkProps;

const MotionLink = motion(Link);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const PraxisButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, PraxisButtonProps>(
  function PraxisButton(
    { variant = "primary", size = "md", loading, className, children, ...rest },
    ref,
  ) {
    const base =
      "inline-flex items-center justify-center font-medium select-none border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a3d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0908] disabled:pointer-events-none disabled:opacity-40 transition-colors";
    const variantCls = variantClasses[variant];
    const sizeCls = sizeClasses[size];
    const cls = [base, variantCls, sizeCls, className].filter(Boolean).join(" ");

    const tap = { scale: 0.98, y: 0 };
    const hover = variantHover[variant];

    const content = (
      <>
        {loading && <Spinner size={size === "sm" ? 12 : 14} />}
        {children}
      </>
    );

    if ("href" in rest && rest.href !== undefined) {
      const { href, ...linkRest } = rest as LinkProps;
      return (
        <MotionLink
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={cls}
          whileHover={hover}
          whileTap={tap}
          transition={{ duration: 0.18, ease: EASE }}
          {...(linkRest as object)}
        >
          {content}
        </MotionLink>
      );
    }

    const { disabled, ...btnRest } = rest as ButtonProps;
    return (
      <motion.button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={cls}
        disabled={disabled || loading}
        whileHover={disabled || loading ? {} : hover}
        whileTap={disabled || loading ? {} : tap}
        transition={{ duration: 0.18, ease: EASE }}
        {...(btnRest as object)}
      >
        {content}
      </motion.button>
    );
  },
);

PraxisButton.displayName = "PraxisButton";

export default PraxisButton;
