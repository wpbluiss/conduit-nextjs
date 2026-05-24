# Contract — Foundations (Slice 0)

**Files**: `src/styles/praxis-design-language.css`, `src/components/conduit/brand-marks/*`, `src/components/conduit/pdl/*`
**Spec FRs**: P1, P2, P3, P4, P6, P7 (foundations enable; surfaces apply)

---

## 1. CSS sheet contract (`praxis-design-language.css`)

### 1.1 File location + import

- File: `src/styles/praxis-design-language.css`.
- Imported from `src/app/layout.tsx` AFTER `praxis-tokens.css` + `praxis-system.css` but BEFORE the engineering-cinema + memory-desk sheets (so feature sheets can override pdl tokens if necessary during the rollout).
- Selector scope: `.praxis-root` (existing) for all token definitions and utility classes.

### 1.2 Token block layout

```css
/* Default = dark; no [data-praxis-theme] required */
.praxis-root {
  /* Canvas */
  --pdl-canvas: #0A0815;
  --pdl-surface: #131027;
  --pdl-surface-raised: #1A152F;
  --pdl-surface-glass: rgba(20, 16, 31, 0.65);
  /* Text */
  --pdl-text: #F5F1EA;
  --pdl-text-muted: #8A88A4;
  --pdl-text-soft: #5E5C76;
  /* Borders */
  --pdl-border-hairline: rgba(245, 241, 234, 0.08);
  --pdl-border-default: rgba(245, 241, 234, 0.14);
  --pdl-border-strong: rgba(245, 241, 234, 0.22);
  /* Accent */
  --pdl-accent: oklch(58% 0.22 290);
  --pdl-accent-soft: oklch(58% 0.22 290 / 0.14);
  --pdl-accent-glow: oklch(58% 0.22 290 / 0.35);
  /* Node-graph */
  --pdl-node-fill: var(--pdl-surface);
  --pdl-node-border: var(--pdl-border-default);
  --pdl-node-glow: oklch(70% 0.22 290 / 0.50);
  --pdl-edge: rgba(245, 241, 234, 0.18);
  --pdl-dot-grid: rgba(245, 241, 234, 0.05);
  --pdl-dot-grid-strong: rgba(245, 241, 234, 0.10);
  /* Dept jewel-tones (dark) — 9 entries */
  --pdl-dept-jarvis: #C8C5BD;
  --pdl-dept-marketing: #FF8A3D;
  --pdl-dept-sales: #34D399;
  --pdl-dept-engineering: oklch(60% 0.22 248);
  --pdl-dept-finance: #EAB308;
  --pdl-dept-compliance: #A855F7;
  --pdl-dept-hr: #EC4899;
  --pdl-dept-ops: #14B8A6;
  --pdl-dept-legal: #3B82F6;
  /* Spacing (10 steps) */
  --pdl-space-xs: 4px;
  --pdl-space-sm: 8px;
  --pdl-space-md: 12px;
  --pdl-space: 16px;
  --pdl-space-lg: 24px;
  --pdl-space-xl: 32px;
  --pdl-space-2xl: 48px;
  --pdl-space-3xl: 64px;
  --pdl-space-4xl: 96px;
  /* Radii (5 steps) */
  --pdl-radius-sharp: 4px;
  --pdl-radius-default: 8px;
  --pdl-radius-soft: 12px;
  --pdl-radius-soft-lg: 16px;
  --pdl-radius-round: 9999px;
  /* Elevation (4 steps) */
  --pdl-elev-1: 0 1px 2px rgba(0, 0, 0, 0.35);
  --pdl-elev-2: 0 4px 16px rgba(0, 0, 0, 0.40);
  --pdl-elev-3: 0 16px 48px rgba(0, 0, 0, 0.50);
  --pdl-elev-glow: 0 0 24px var(--pdl-accent-glow);
  /* Motion (5 durations + 3 easings) */
  --pdl-dur-ultra: 120ms;
  --pdl-dur-default: 220ms;
  --pdl-dur-emphasis: 360ms;
  --pdl-dur-transition: 480ms;
  --pdl-dur-celebration: 1200ms;
  --pdl-ease: cubic-bezier(0.22, 0.61, 0.36, 1);
  --pdl-ease-emphasis: cubic-bezier(0.4, 0, 0.2, 1);
  --pdl-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Light overrides */
html[data-praxis-theme="light"] .praxis-root {
  --pdl-canvas: #F7F4EE;
  --pdl-surface: #FFFFFF;
  --pdl-surface-raised: #FAF7F1;
  --pdl-surface-glass: rgba(255, 255, 255, 0.75);
  --pdl-text: #14101F;
  --pdl-text-muted: #6A6878;
  --pdl-text-soft: #A5A3B3;
  --pdl-border-hairline: rgba(20, 16, 31, 0.06);
  --pdl-border-default: rgba(20, 16, 31, 0.12);
  --pdl-border-strong: rgba(20, 16, 31, 0.20);
  --pdl-accent: oklch(42% 0.20 290);
  --pdl-accent-soft: oklch(42% 0.20 290 / 0.12);
  --pdl-accent-glow: oklch(42% 0.20 290 / 0.25);
  --pdl-node-glow: oklch(42% 0.20 290 / 0.30);
  --pdl-edge: rgba(20, 16, 31, 0.16);
  --pdl-dot-grid: rgba(20, 16, 31, 0.06);
  --pdl-dot-grid-strong: rgba(20, 16, 31, 0.12);
  --pdl-dept-jarvis: #7F7C72;
  --pdl-dept-marketing: #C76A2A;
  --pdl-dept-sales: #128054;
  --pdl-dept-engineering: oklch(38% 0.20 248);
  --pdl-dept-finance: #A77D08;
  --pdl-dept-compliance: #6C2BBA;
  --pdl-dept-hr: #B62571;
  --pdl-dept-ops: #0A6B62;
  --pdl-dept-legal: #1E4FB0;
  /* Elevation (light) */
  --pdl-elev-1: 0 1px 2px rgba(20, 16, 31, 0.06);
  --pdl-elev-2: 0 4px 16px rgba(20, 16, 31, 0.08);
  --pdl-elev-3: 0 16px 48px rgba(20, 16, 31, 0.12);
}
```

### 1.3 Utility classes

```css
.pdl-glass {
  background: var(--pdl-surface-glass);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid var(--pdl-border-hairline);
  box-shadow: var(--pdl-elev-3);
  border-radius: var(--pdl-radius-soft-lg);
}

.pdl-canvas-grid {
  background-color: var(--pdl-canvas);
  background-image:
    radial-gradient(circle, var(--pdl-dot-grid) 1px, transparent 1px);
  background-size: 24px 24px;
  background-position: 0 0;
}
.pdl-canvas-grid[data-strong="true"] {
  background-image:
    radial-gradient(circle, var(--pdl-dot-grid-strong) 1px, transparent 1px);
}
```

---

## 2. Primitive contracts (Slice 0 components)

### 2.1 `BrandChip`

```ts
interface BrandChipProps {
  kind: BrandKind;                       // see BRAND_MARKS registry
  size?: "sm" | "md" | "lg";              // 20 / 32 / 48 px
  className?: string;
}
```

- Renders a circular surface containing the brand mark.
- Surface uses `--pdl-surface` (dark) / `--pdl-surface-raised` (light).
- Border: 1px `--pdl-border-hairline`.
- Inner padding: ~15% of size for visual breathing room.
- No glow by default; consumers can wrap in a `<HoverReveal>` for hover-glow.

### 2.2 `DeptIcon`

```ts
interface DeptIconProps {
  employee: EmployeeId;
  size?: number;        // default 16
  className?: string;
}
```

- Reads from `EMPLOYEE_ICON` (`src/components/conduit/EmployeeBadge.tsx`).
- Renders the Lucide icon in `currentColor` (no dept tinting — that's the parent's job).
- NEVER renders text. The 9-employee identity comes through icon shape, not letter.

### 2.3 `Avatar`

```ts
interface AvatarProps {
  variant: "employee" | "brand";
  employee?: EmployeeId;       // when variant === "employee"
  brand?: BrandKind;            // when variant === "brand"
  size?: "sm" | "md" | "lg" | "xl";  // 20 / 32 / 48 / 72
  className?: string;
}
```

- Composes `<DeptIcon>` (employee) or `<BrandChip>` (brand) inside a circular surface.
- NEVER falls back to text-initials. If `employee` is invalid, returns `null` + console.warn.

### 2.4 `HoverReveal`

```ts
interface HoverRevealProps {
  children: React.ReactNode;
  /** Class added to children when parent is hovered. Default uses CSS only. */
  className?: string;
}
```

- Hidden by default (`opacity: 0; visibility: hidden`).
- On parent hover: `opacity: 1; visibility: visible` with translate-from-below.
- Transition: `--pdl-dur-default` `--pdl-ease`.
- Touch devices (`@media (hover: none)`): always visible.
- The PARENT element must trigger the `:hover` (consumers wrap in their own card/node).

### 2.5 `Tooltip`

```ts
interface TooltipProps {
  trigger: React.ReactNode;
  children: React.ReactNode;      // tooltip content
  side?: "top" | "right" | "bottom" | "left";  // default "top"
  maxWidth?: number;               // default 280
}
```

- Tooltip surface uses `.pdl-glass`.
- Appears on `trigger` hover with 200ms delay; dismisses on mouseleave.
- Positioning is absolute via parent transform.
- For complex tooltip content (Memory canvas), wrap children in custom JSX inside the tooltip.

### 2.6 `Popover`

```ts
interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}
```

- Click-triggered (vs Tooltip's hover-trigger).
- Surface uses `.pdl-glass`.
- Dismisses on outside-click + Escape.

### 2.7 `Drawer`

```ts
interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: "right" | "bottom";       // default "right" desktop, auto "bottom" on mobile
  title?: string;
  description?: string;
}
```

- Surface uses `.pdl-glass` with stronger blur (24 px).
- Desktop: right-slide 320 ms with `--pdl-ease`.
- Mobile (≤ 640 px): bottom-sheet from bottom.
- Backdrop: `rgba(0, 0, 0, 0.35)` in dark / `rgba(20, 16, 31, 0.20)` in light, plus blur(8 px) on the backdrop.
- Escape + outside-click dismiss.

### 2.8 `Modal`

```ts
interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
}
```

- Centered dialog. Use sparingly (per P3 — drawer or popover preferred).
- Surface uses `.pdl-glass`.
- Same backdrop treatment as Drawer.
- Reserved for true confirm-or-cancel moments (destructive actions, sign-out).

### 2.9 `Canvas`

```ts
interface CanvasProps {
  children: React.ReactNode;      // nodes + edges
  /** Visual density: 1 = standard 24px grid; 2 = strong 24px grid */
  density?: 1 | 2;
  className?: string;
}
```

- Wraps `.pdl-canvas-grid` div.
- Provides absolute positioning context.
- No pan/zoom in v1 (Memory canvas).

### 2.10 `Node`

```ts
interface NodeProps {
  position: { x: number; y: number };       // px from canvas top-left
  size?: number;                             // default 48
  tone?: string;                              // CSS color (dept jewel-tone OR null = neutral)
  state?: "idle" | "hover" | "active";
  children?: React.ReactNode;                 // optional inner content (icon, chip)
  onClick?: () => void;
  className?: string;
}
```

- Absolutely positioned at `position`.
- Circular surface with size diameter.
- Glow on hover: `box-shadow: 0 0 24px tone` (or `--pdl-node-glow` if tone is null).
- Ambient pulse on idle (4 s loop, opacity 0.85 → 1) — reduced-motion gated.
- Inner content centered.

### 2.11 `Edge`

```ts
interface EdgeProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  tone?: string;
  dashed?: boolean;
}
```

- SVG path between two points (quadratic Bezier with auto-curvature).
- Stroke: `--pdl-edge` (or `tone` if provided).
- Opacity 0.6 by default; 1 when dashed (dashed edges are inter-cluster).

### 2.12 `PillTabBar`

```ts
interface PillTabBarProps<T extends string> {
  tabs: { id: T; label: string; icon?: React.ReactNode }[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
}
```

- 2-3 pills max (enforced at consumer level; spec rule).
- Surface uses `.pdl-glass`.
- Active pill fills with `--pdl-accent`; text in `--pdl-text`.
- Inactive: text in `--pdl-text-muted`.
- Transition between pills: 220 ms ease.

### 2.13 `Composer`

```ts
interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  /** Renders ABOVE the textarea — used by MemoryNodeComposer for kind+scope pickers */
  children?: React.ReactNode;
  className?: string;
}
```

- Glassmorphic shell via `.pdl-glass`.
- Multiline textarea (default 3 rows, auto-grows).
- Submit on cmd/ctrl+enter; configurable.
- Reused by chat composer (future) and Memory node composer (Slice 1).

---

## 3. Layout integration

`src/app/layout.tsx` modifications (Slice 0):

1. Replace `import { Inter } from "next/font/google"` with `import { GeistSans } from "geist/font/sans"`.
2. Replace `const inter = Inter({ variable: "--font-sans", subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" })` with `// GeistSans exports its own .variable directly`.
3. In the `<html>` tag's className: replace `${inter.variable}` with `${GeistSans.variable}`.
4. Add `import "@/styles/praxis-design-language.css"` after `praxis-system.css`.

The `--font-sans` CSS variable is now bound to Geist Sans. Existing
`font-sans` Tailwind utility class continues to work; no per-component
changes needed.

---

## 4. Verification (Slice 0)

See `quickstart.md §1`.
