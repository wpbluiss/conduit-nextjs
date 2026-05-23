# Contract — Token Sheet

The locked, single source of truth for every color/space/type/motion
value used by redesigned Praxis console surfaces. Any value not on
this sheet is a violation of FR-036 / FR-037 / FR-038 and must be
either added to the sheet or rejected.

**Scope**: all tokens declared under `.praxis-root` in
`src/styles/praxis-tokens.css` and consumed in
`src/styles/praxis-system.css` (NEW).

**Theme parity**: every token MUST exist in both the default (dark)
declaration and the `html[data-praxis-theme="light"] .praxis-root`
override block. The token *names* are identical across themes; the
*values* differ.

---

## A. Color tokens (consumed)

See `data-model.md §1.1` for the existing color tokens. The redesign
adds NO new base color tokens — every new color value derives from
the existing `--color-dept-*` and surface tokens via `color-mix()`.

## B. Color tokens (NEW — derived)

See `data-model.md §1.2`. Five derivations × 9 depts. Atlas exception
for wash variants.

## C. Spacing scale (NEW)

See `data-model.md §1.3`. 8 steps. No off-scale values permitted on
redesigned surfaces.

## D. Card padding presets (NEW)

See `data-model.md §1.4`. `--space-card-{sm,md,lg}`.

## E. Radii (NEW)

See `data-model.md §1.5`. Four named radii.

## F. Typography (NEW)

See `data-model.md §1.6`. One hero step shared across all three
hero-bearing surfaces (FR-016). Locked eyebrow style (FR-017). Locked
numeric style with tabular figures (FR-019).

## G. Elevation (NEW)

See `data-model.md §1.7`. Three rest levels, three hover levels.
Hover levels parameterize the dept-tinted outer glow via a consumed
`--dept` CSS variable.

## H. Motion (NEW)

See `data-model.md §1.8`. Three easing curves, nine rhythm tokens
(with mobile 1.2× multiplier), one lift token.

## I. Linting / verification

A pre-merge step (manual, added to the PR template) MUST grep the
redesigned surface files for:

```
# Hard-fail patterns on redesigned surface files
\btext-\[\d+(px|rem)\]\b              # FR-036
\bmin-h-\[\d+px\]\b                   # FR-036
\bpx-\[\d+(px|rem)\]\b                # FR-036
#[0-9A-Fa-f]{3,8}\b                   # FR-037 (hex literals in component code)
\bcubic-bezier\(                      # FR-038 (inline easing)
\banimation-duration:\s*\d+(ms|s)\b   # FR-038 (inline duration in component <style>)
```

Redesigned surface files for this PR:
- `src/app/app/workspace/page.tsx`
- `src/app/app/team/[employee]/page.tsx` (header block + stat tiles only)
- `src/components/conduit/Chat.tsx` (empty state + composer + handoff card + bubble)
- All files under `src/components/conduit/praxis/` (NEW)
- `src/styles/praxis-system.css` (NEW — exempt from the lint;
  authoring location)

Any hit on these files is a Phase-3 fix required before merge.

---

## J. Token-reference document

Per FR-039, a human-readable design system document MUST ship at
`docs/praxis-design-system.md` cataloguing every token + primitive
with an example. The document is generated and maintained by the
implementer alongside the code; it is the artifact a future
designer/developer reads to add the 4th, 5th, Nth surface to the
system without re-deriving the conventions.

Minimum sections:
1. **Tokens** — every token from this contract, grouped, with example
   values in both themes.
2. **Primitives** — every class from `praxis-system.css` with an
   inline HTML example.
3. **Surface-to-primitive map** — for each redesigned surface, which
   primitives it uses.
4. **Motion vocabulary** — the named keyframes + reduced-motion
   policy table per FR-057.
5. **Don'ts** — anti-patterns: hex literals in JSX, arbitrary
   Tailwind utilities, framer-motion in `/app/*`, JS-driven color
   animation.
