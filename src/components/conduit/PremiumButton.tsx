"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "primary-inverse" | "secondary-inverse";
export type ButtonSize = "sm" | "md" | "lg";

const BASE: Record<ButtonVariant, string> = {
  primary:           "conduit-btn-primary",
  secondary:         "conduit-btn-secondary",
  ghost:             "conduit-btn-ghost",
  danger:            "conduit-btn-danger",
  "primary-inverse": "conduit-btn-primary-inverse",
  "secondary-inverse": "conduit-btn-secondary-inverse",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "conduit-btn-sm",
  md: "",
  lg: "conduit-btn-lg",
};

// Spring that feels satisfying but doesn't overshoot buttons.
const TAP_SPRING = { type: "spring", stiffness: 500, damping: 40 } as const;

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

type ButtonProps = CommonProps &
  Omit<React.ComponentProps<"button">, keyof CommonProps> & {
    href?: undefined;
  };

type LinkProps = CommonProps &
  Omit<React.ComponentProps<typeof Link>, keyof CommonProps | "href"> & {
    href: string;
  };

type PremiumButtonProps = ButtonProps | LinkProps;

/**
 * Single premium button primitive used across all marketing surfaces.
 * Renders as <Link> when href is provided, <button> otherwise.
 * framer-motion spring micro-interaction on press (disabled when reduced-motion).
 */
const PremiumButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, PremiumButtonProps>(
  function PremiumButton(
    { variant = "primary", size = "md", loading = false, className, children, ...rest },
    ref,
  ) {
    const reduced = useReducedMotion();
    const cls = cn(BASE[variant], SIZE[size], className);

    const motionProps = reduced
      ? {}
      : {
          whileHover: { y: -1 },
          whileTap: { y: 0, scale: 0.985 },
          transition: TAP_SPRING,
        };

    const inner = (
      <>
        {loading && <span className="conduit-btn-spinner" aria-hidden />}
        {children}
      </>
    );

    if ("href" in rest && rest.href !== undefined) {
      const { href, ...linkRest } = rest as LinkProps;
      return (
        <motion.div style={{ display: "inline-flex" }} {...motionProps}>
          <Link
            href={href}
            className={cls}
            ref={ref as React.Ref<HTMLAnchorElement>}
            aria-disabled={loading || undefined}
            {...(linkRest as object)}
          >
            {inner}
          </Link>
        </motion.div>
      );
    }

    const { disabled, ...buttonRest } = rest as ButtonProps;
    return (
      <motion.button
        className={cls}
        ref={ref as React.Ref<HTMLButtonElement>}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...motionProps}
        {...(buttonRest as object)}
      >
        {inner}
      </motion.button>
    );
  },
);

export default PremiumButton;
