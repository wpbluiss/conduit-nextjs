/**
 * Praxis console canonical Button — Apple-grade, electric violet dark system.
 *
 * THE single source of truth for interactive button elements across /app,
 * /chat, and Settings. Backed by PraxisButton (framer-motion, all five states).
 *
 * ## Variants
 * - `primary`   — electric violet fill; use for the main CTA on a surface
 * - `secondary` — glass (frosted, translucent); for secondary actions
 * - `ghost`     — transparent base, hover wash; for tertiary/inline actions
 * - `danger`    — red-coral fill; for destructive actions (delete, revoke)
 *
 * ## Sizes
 * - `sm`      — 32px (13px text)
 * - `md`      — 40px (14px text) · default
 * - `lg`      — 48px (16px text)
 * - `icon`    — 44px square, fully circular; use with an icon child only
 * - `icon-sm` — 36px square; compact icon buttons in toolbars
 *
 * ## States (non-negotiable per CONSOLE_REDESIGN.md)
 * rest → hover (lift + brighten) → active (scale 0.96 + shadow collapse,
 * springy release) → focus-visible (accent ring) → loading (inline spinner,
 * label holds width) → disabled (dim, no motion).
 * All ≤200ms, `[0.22,1,0.36,1]` ease, reduced-motion safe.
 *
 * ## Usage
 * ```tsx
 * import { Button } from "@/components/conduit/ui/Button"
 *
 * // Action button
 * <Button variant="primary" onClick={handleSave}>Save changes</Button>
 *
 * // Loading state (label width is preserved — no layout shift)
 * <Button variant="primary" isLoading loadingText="Saving…">Save changes</Button>
 *
 * // Disabled
 * <Button variant="danger" isDisabled>Delete account</Button>
 *
 * // Icon button (pair with aria-label)
 * <Button variant="ghost" size="icon-sm" aria-label="Close">
 *   <X size={16} />
 * </Button>
 * ```
 *
 * ## Link-as-button pattern
 * For navigation that *looks* like a button, use CSS classes directly on
 * `<Link>` — this preserves correct semantics (links navigate; buttons act):
 * ```tsx
 * <Link href="/app" className="btn-primary btn-sz-md">Go to workspace</Link>
 * ```
 * CSS: `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger` +
 *       `.btn-sz-sm`, `.btn-sz-md`, `.btn-sz-lg` (defined in globals.css).
 *
 * ## Canonical import
 * Always import from `@/components/conduit/ui/Button` — not from PraxisButton
 * directly. The `PraxisButton` name is the internal implementation detail.
 */
export { PraxisButton as Button, SpinnerIcon } from "@/components/conduit/PraxisButton";
export type { PraxisButtonVariant as ButtonVariant, PraxisButtonSize as ButtonSize } from "@/components/conduit/PraxisButton";
