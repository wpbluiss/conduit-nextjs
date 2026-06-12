"use client";

import { forwardRef } from "react";
import Link, { type LinkProps } from "next/link";
import { motion, useReducedMotion } from "framer-motion";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "conduit-btn-primary",
  secondary: "conduit-btn-secondary",
  ghost: "conduit-btn-ghost",
  danger: "conduit-btn-danger",
};

const SIZE_OVERRIDES: Record<Size, string> = {
  sm: "!py-2 !px-4 !text-[13px]",
  md: "",
  lg: "!py-4 !px-8 !text-[15px]",
};

interface PraxisButtonBaseProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
}

type PraxisButtonProps = PraxisButtonBaseProps &
  (
    | ({ asLink: true } & Pick<LinkProps, "href"> & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">)
    | ({ asLink?: false } & React.ButtonHTMLAttributes<HTMLButtonElement>)
  );

const MotionLink = motion.create(Link);

export const PraxisButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, PraxisButtonProps>(
  function PraxisButton(props, _ref) {
    const { variant = "primary", size = "md", loading, className, children, ...rest } = props;
    const prefersReduced = useReducedMotion();

    const baseClass = [
      VARIANT_CLASS[variant],
      SIZE_OVERRIDES[size],
      loading ? "conduit-btn--loading" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const tapAnimation = prefersReduced ? {} : { scale: 0.97 };
    const hoverAnimation = prefersReduced ? {} : { y: -2 };
    const transition = { duration: 0.15, ease: [0.25, 1, 0.5, 1] as const };

    const spinner = loading ? (
      <span className="conduit-btn__spinner" aria-hidden />
    ) : null;

    if ("asLink" in props && props.asLink) {
      const { asLink: _asLink, href, ...linkRest } = rest as { asLink: true; href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>;
      return (
        <MotionLink
          href={href}
          className={baseClass}
          whileTap={tapAnimation}
          whileHover={hoverAnimation}
          transition={transition}
          {...(linkRest as object)}
        >
          {spinner}
          {children}
        </MotionLink>
      );
    }

    const buttonRest = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <motion.button
        className={baseClass}
        disabled={loading || buttonRest.disabled}
        whileTap={tapAnimation}
        whileHover={hoverAnimation}
        transition={transition}
        {...(buttonRest as object)}
      >
        {spinner}
        {children}
      </motion.button>
    );
  }
);
