/**
 * Canonical specialist identity chip — compact dept-icon + name pill used in
 * chat message attribution rows and the thinking indicator.
 *
 * Visual: glass-style dept-tinted background (no extra backdrop-filter since
 * chips are typically nested inside glass surfaces), dept-tinted border,
 * standard cx-glass top-edge highlight, 12px Geist Mono text.
 *
 * ## Usage
 * ```tsx
 * import { SpecialistChip } from "@/components/conduit/ui/SpecialistChip"
 *
 * // Default — shows the canonical specialist name
 * <SpecialistChip employee="engineering" />
 *
 * // Override label (e.g. for custom nicknames)
 * <SpecialistChip employee="marketing" label="Brand" />
 * ```
 */
export { SpecialistChip } from "@/components/conduit/EmployeeBadge";
