# Sidebar — R18 (Praxis Design Language)

**Date:** 2026-05-31
**Branch:** main (slice complete; build green; NOT deployed — user validates on preview before push)
**Spec:** `specs/praxis-design-language/`
**Round:** R18 — Sidebar rebuild (the highest-leverage surface: renders on every `/app/*` route)

---

## TL;DR

The always-expanded, text-heavy rail is gone. `/app/*` now renders a
collapsible **icon-rail** on `--pdl-*` tokens + `pdl/*` primitives:
56 px by default, **hover-peeks** to 216 px as an overlay (canvas doesn't
reflow), **pin-locks** open in flow (persisted). The inline 9-employee
list collapses into a single **Team** item that opens a right-flyout
`Popover`; "+ New chat" becomes **one quiet icon**; account actions move
into a bottom account `Popover`. Closes spec findings **S-1, S-2, S-3,
S-4, C-1** and the "black/white split bug." Every preserved behaviour
(streaming dot, build pip, lock gating, recent, tier, sign-out, mobile)
carries through. Build green (tsc + build). NOT deployed.

A 5-dimension adversarial review (× 2-skeptic verification) ran against
the diff; all confirmed findings are fixed, **plus** a root-cause defect
the review under-scoped: the pdl `Popover`/`Tooltip` glass never rendered
when portaled. Repaired at the primitive.

---

## Decisions locked this slice (user GATE, via AskUserQuestion)

| Fork | Choice | Spec basis |
|---|---|---|
| Collapse behaviour | **Hover-peek + pin-lock** (56 ↔ 216 px; pin persisted) | P3, spec O-4 (was left open) |
| Team in sidebar | **Single item → right-flyout `Popover`** of the 9 specialists (no new route) | S-1 ("9 employees live off the rail") |
| New chat | **One quiet icon** (cmd+K palette deferred — none exists yet) | S-2 / P2 |

---

## What changed

### New files

| Path | Purpose |
|---|---|
| `src/styles/sidebar.css` | All rail styling on `--pdl-*` tokens. Rail footprint + absolute panel (the hover-peek overlay mechanism), reveal-on-expand (labels / group headers / recent / footer fade in only when expanded), nav items with a **quiet** active cue (accent-soft fill + short 2.5 px bar, no full-height stripe), dept glyph, status/streaming pips, Team + account flyout surfaces, mobile off-canvas sheet, token-aware scrim. Reduced-motion gates the width/transform choreography + status pulse. |

### Modified files

| Path | Change |
|---|---|
| `src/components/conduit/Sidebar.tsx` | Full rewrite on `pdl/*`. Icon-rail shell; `localStorage`-persisted pin (`praxis:sidebar:pinned`); New-chat quiet icon; primary surfaces (Workspace, Memory, Team, Builds, Voice, Leads, Analytics); Team → `Popover` flyout (`TeamFlyout`); Recent capped at **4**, reveal-only; bottom account `Popover` (`AccountMenu`: Settings / Billing / Sign-out / tier); token-aware mobile scrim. |
| `src/components/conduit/pdl/Popover.tsx` | **Root-cause fix** — portal now wraps content in a `<div className="praxis-root">` PARENT (mirrors the working `Drawer`/`Modal`) so the `.praxis-root .pdl-popover` / `.pdl-glass` descendant recipes resolve. Previously `praxis-root` sat on the styled node itself → glass never applied (the defect that forced Slice 1 to hand-roll its own tooltip). Added optional `ariaLabel` prop for the `role="dialog"` accessible name. |
| `src/components/conduit/pdl/Tooltip.tsx` | Same portal-parent wrap (repairs the sibling primitive; only the `pdl-scratch` dev page consumes it today). |
| `src/app/app/layout.tsx` | Shell seam fix: root shell is now `bg-[var(--pdl-canvas)]` (was `--color-surface`). Rail rides `--pdl-surface` + a hairline — the deliberate structure that replaces the old hard split. |
| `src/app/layout.tsx` | Adds `import "@/styles/sidebar.css"` after `memory-canvas.css`. |

---

## Spec findings closed

| # | Finding | Resolution |
|---|---|---|
| **S-1** | Team list expands inline (9 employees, text labels) | Single **Team** item → right-flyout `Popover`; per-employee surfaces still reachable here + from the Workspace roster. |
| **S-2** | Always-visible "+ New chat" CTA | One quiet `＋` icon (full-strength label + accent icon; hovers like its peers, no louder fill). cmd+K deferred — no palette exists yet. |
| **S-3** | Rail always expanded, no collapse | Icon-default 56 px, hover-peek + pin-lock, persisted. |
| **S-4** | Heavy active stripe + chip color | Quiet cue: accent-soft fill + short 2.5 px bar. Team chips → icon-only in the flyout. |
| **C-1** | `bg-black/60` mobile overlay | Token-aware `.pdl-scrim` (rgba dark / rgba light + blur). |
| seam | "black/white split bug" (`layout.tsx:75,92`) | Shell `--pdl-canvas`, rail `--pdl-surface` + hairline. |

## Preserved behaviours (verified against the prior rail)

Streaming employee dot (`conduit:stream` listener + cleanup; pip on the
Team icon, pulsed dot in the flyout) · in-flight **build pip**
(`SidebarBuildPip`, tight positioned parent) · allowed-employee **lock
gating** (locked → `/app/settings` + Lock; allowed → `/app/team/<emp>`) ·
**recent** conversations (dept glyph, team conic gradient, active state) ·
tier line · **sign-out** form POST to `/auth/sign-out` · mobile open/close
· New chat → `router.push("/app")` + `refresh()`.

---

## Verification

- `npx tsc --noEmit` → **exit 0**.
- `npm run build` → **exit 0** (only a benign `module.register()` toolchain deprecation).
- **Adversarial review** (workflow): 5 dimensions — spec-alignment, behaviour-preservation, theme-parity, a11y/motion, css-mechanics — each finding cross-examined by 2 independent skeptics. 6 raised → 5 confirmed → all fixed:
  - **[blocker]** Team/Account popovers stacked **behind** the mobile sheet (z 45 < rail 60) → unreachable on mobile. Fixed: `.pdl-popover.pdl-sidebar-flyout { z-index: 80 }` (above sheet 60 + scrim 55; harmless on desktop).
  - **[root cause, review under-scoped]** portaled `Popover`/`Tooltip` glass never applied (descendant selector vs. self-`praxis-root`). Fixed at the primitive (portal-parent wrap).
  - **[minor a11y]** `role="dialog"` had no accessible name → added `ariaLabel` ("Your team" / "Account menu").
  - **[nit]** New-chat solid-fill hover was the loudest element + hid the active bar → softened to accent-soft (resolves both).
  - **[nit]** dead `.pdl-nav-sep` CSS → removed.
- **Theme-parity audit (P4):** zero hardcoded colors in `sidebar.css` / `Sidebar.tsx` (only `white-space`; `bg-black` only in comments). All color resolves via `--pdl-*`, defined for both themes.

### Not done locally — needs preview (per Constitution V)

This sandbox has **no Supabase credentials**, so the edge proxy 500s every
runtime request — `/app/*` and any local render are unreachable here. A
throwaway public route + Playwright sweep was built and then removed when
the proxy blocked it; **pixel-level light/dark/mobile + reduced-motion
confirmation is the user's preview-deploy step**, matching how Slices 0/1
were gated.

---

## Slice gate — STOP

Build green; findings fixed; behaviours preserved; theme parity audited.
**No Settings / Workspace / Chat rebuild until the user validates this
rail on preview and signs off.** Suggested walk: collapse↔hover↔pin;
Team flyout (incl. a locked employee); New chat; a Recent row; account
menu → sign-out; both themes; 390 px mobile sheet + Team flyout over it;
reduced-motion.

### Follow-ups (not this slice)

- The `Popover`/`Tooltip` primitive repair means Slice 1's `MemoryNodeTooltip` could now migrate back onto the pdl `Tooltip` — optional cleanup for a future foundations pass.
- cmd+K command palette (would let New chat bind to a shortcut per S-2's original intent).
