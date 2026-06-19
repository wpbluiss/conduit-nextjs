/**
 * Canonical specialist avatar — unified dept-icon + custom-initials component
 * for the sidebar roster, specialist selector, and chat attribution row.
 *
 * ## Variants (via props, not a separate variant prop)
 * - Built-in specialist: pass `employee` key → renders the dept Lucide icon at
 *   1.75px stroke. Active state uses the electric-violet accent; rest state uses
 *   the dept identity color.
 * - Custom specialist: pass `name` (and optional `color`) → renders initials.
 *
 * ## States
 * - `active`    — accent bg + accent icon + accent glow ring (sidebar / selector)
 * - `streaming` — dept pulse animation while the specialist is generating
 * - `rewarded`  — brief green ring + spark burst on completion
 *
 * ## Usage
 * ```tsx
 * import { SpecialistAvatar } from "@/components/conduit/ui/SpecialistAvatar"
 *
 * // Built-in specialist, active in sidebar
 * <SpecialistAvatar employee="engineering" size={24} active={isSelected} />
 *
 * // Built-in specialist, streaming in chat
 * <SpecialistAvatar employee="marketing" size={32} streaming={isPending} />
 *
 * // Custom specialist
 * <SpecialistAvatar name="My Bot" color="#6366f1" size={28} />
 * ```
 */
export { SpecialistAvatar } from "@/components/conduit/SpecialistAvatar";
export type { SpecialistAvatarProps } from "@/components/conduit/SpecialistAvatar";
