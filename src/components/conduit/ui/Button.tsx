/**
 * Praxis console canonical Button — Apple-grade, electric violet dark system.
 * Single source of truth for interactive button elements in /app.
 *
 * Variants: primary | secondary | ghost | danger
 * Sizes:    sm | md (default) | lg | icon | icon-sm
 *
 * CSS lives in globals.css (.btn-primary / .btn-secondary / .btn-ghost / .btn-danger).
 * Framer-motion (whileHover/whileTap) handles the physical press feel.
 * PraxisButton is the underlying implementation; Button is the canonical export.
 */
export { PraxisButton as Button, SpinnerIcon } from "@/components/conduit/PraxisButton";
export type { PraxisButtonVariant as ButtonVariant, PraxisButtonSize as ButtonSize } from "@/components/conduit/PraxisButton";
