# CONSOLE_REDESIGN.md — the Praxis app redesign spec (READ BEFORE ANY /app UI WORK)

This is the authoritative spec for a **ground-up redesign of the logged-in console** (`/app`,
`/chat`, settings, every in-product surface). The founder's mandate: the current console UI is
NOT acceptable — spacing, sidebar, bubbles, composer, density, typography, and especially the
colors all need to be replaced. Build the **best-in-the-world** AI-workforce console: premium,
**psychologically engaging / addictive**, and **instant-fast**. Every page, every button, every
pixel must have intent. When in doubt, raise the bar.

This spec governs the **console only**. It does NOT touch `/finance` (Cadence). Marketing pages
keep their identity unless a task says otherwise.

## Direction (locked by founder): "Bold & addictive, dark"
Deep near-black base, ONE electric accent, high contrast, decisive motion, reward feedback.
Reference feel: Linear's dark mode precision + a louder, more energetic accent. NOT the old
ember/warm-black palette — that is being retired in the console.

## Color system (use CSS variables; define once, reuse everywhere — no one-off hexes)
Dark, high-contrast, single electric accent + a reward-positive green. Define in the console
token layer and replace the ember/warm tokens on /app surfaces.
- **Ink (backgrounds):** canvas `#0B0B0F`, surface `#131319`, raised `#1C1C26`, overlay `#23232E`.
- **Borders/hairlines:** subtle `#262630`, strong `#33333F`.
- **Text:** primary `#F4F4F7`, muted `#A0A0B0`, faint `#6B6B7B`.
- **Accent (electric violet — the ONE accent):** base `#7C6CFF`, bright/hover `#9B8CFF`,
  tint bg `rgba(124,108,255,0.12)`, glow `0 0 0 3px rgba(124,108,255,0.25)` for focus/CTA.
- **Reward / positive (celebrations, "shipped", wins):** `#34D399`.
- **Danger:** `#F4607D`. Keep semantic colors muted except where they carry meaning.
- Accent is used DECISIVELY but sparingly — primary CTA, active state, focus, live pulse,
  reward moments. Everything else is the ink + text scale. One accent, used with conviction.

## Typography
- Geist / Geist Mono (already installed). Tight, deliberate scale; no default sizes.
- Scale (rem): 12 / 13 / 14 (body) / 16 / 20 / 24 / 32 / 44. Line-heights tight on headings
  (1.05–1.15), comfortable on body (1.55–1.65). Letter-spacing -0.01 to -0.02em on large text.
- Numbers/labels/metadata in mono for that "engineered" feel.

## Spacing & density
- 4px base scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64. Use the scale — never arbitrary values.
- Intentional, breathable density: generous but not empty. Information-dense surfaces (sidebar,
  message list) stay tight and scannable; focal surfaces (composer, empty state) get air.
- Consistent radii: 8 (controls), 12 (cards), 16 (panels), full (pills/avatars).

## Motion (this is what makes it feel alive + addictive)
- framer-motion. Fast + purposeful: 120–220ms, good easing (`[0.22,1,0.36,1]`). Never janky,
  never gratuitous. Respect `prefers-reduced-motion`.
- Satisfying micro-feedback on EVERY interaction: button press (scale 0.97 + glow), hover lift,
  send animation, message stream-in, sidebar hover. Tactile and rewarding.
- **Reward moments:** when a specialist finishes / a build ships, a tasteful celebratory beat
  (accent→reward-green pulse, subtle confetti/spark, count tick). Dopamine, tastefully.
- Streaming chat: smooth token-by-token reveal; typing indicator with personality.

## Speed (founder requirement: ZERO lag, instant page changes)
- All in-app navigation is **instant client-side** — Next.js `<Link>` with prefetch; never a
  full reload. Switching pages/specialists/conversations must feel immediate (<100ms perceived).
- Prefetch likely-next routes on hover/visibility. Optimistic UI on navigation + actions.
- Persist the app shell (sidebar/layout) across route changes (no re-mount flash). Use route
  groups / parallel routes so only the content panel swaps.
- Skeletons only when data truly isn't ready; otherwise render instantly from cached/optimistic
  state. Trim client JS on the console; lazy-load heavy panels. Target: snappy on mid mobile.

## Per-surface direction
- **App shell / layout:** persistent left sidebar + content panel; never remounts on nav.
  Cohesive dark canvas; clear focal hierarchy; the chat is the hero.
- **Sidebar:** tighter, scannable, premium. Specialist roster with crisp icons + active accent
  state; conversations list with strong hierarchy; subtle hover; no clutter. Collapsible.
- **Chat thread:** the centerpiece. Clean message rhythm, clear specialist attribution, generous
  reading width, beautiful streaming. Rethink bubbles — consider distinct treatments for user vs
  specialist (not generic gray bubbles). Markdown + code blocks must look first-class.
- **Composer:** premium, prominent, satisfying. Clear focus state (accent glow), smooth grow,
  @mention + attachments feel effortless, send is a delightful micro-moment.
- **Buttons / controls:** one coherent system — primary (accent), secondary, ghost, danger;
  real hover/active/focus/loading states with motion. Every button feels clickable and premium.
- **Empty / loading / error states:** intentional and on-brand everywhere — no bare text.
- **Settings:** clean, organized, same system.

## Component system v2 — tactile, glass, alive (founder mandate 2026-06-15)
The founder's words: every component should "feel like Apple buttons," glassmorphism "the whole
way," and the platform must feel premium while the AI "thinks and processes information quickly."
Icons, graphs, and text bubbles need the same level of craft. Everything below is REQUIRED across
the console and is part of the spec the coordinator merges against.

### Apple-grade buttons & controls
- Every button/control feels physical: soft depth (a layered shadow, not a flat fill), a crisp
  tactile press (scale ~0.96 + shadow collapse on `:active`, springy release), and instant
  feedback. SF-precise: even optical sizing, a hairline inner top highlight (`inset 0 1px 0
  rgba(255,255,255,0.12)`), generous touch target (≥44px), perfectly centered glyphs.
- Variants: **primary** = electric violet with a subtle top-light gradient + accent glow on
  hover/focus; **secondary** = glass (see below); **ghost** = text + hover wash; **danger** =
  danger color. Sizes sm/md/lg share one rhythm.
- States are non-negotiable: rest / hover (lift + brighten) / active (press) / focus-visible
  (accent ring) / loading (inline spinner, label holds its width, disabled) / disabled (dim, no
  motion). All ≤200ms, eased `[0.22,1,0.36,1]`, reduced-motion safe.
- Deliver ONE `<Button>` component (variant + size props) and migrate call sites to it. No
  ad-hoc button styling anywhere after this lands.

### Glassmorphism (system-wide surface treatment)
- Layered, translucent "frosted glass" surfaces floating over the dark canvas: sidebar, top bar,
  composer, popovers/menus, modals, toasts, the live/voice overlay, and cards.
- Tokenize the recipe (don't hand-roll per surface): background `rgba(255,255,255,0.04–0.06)`
  over ink, `backdrop-filter: blur(20–28px) saturate(140%)`, 1px hairline border
  `rgba(255,255,255,0.08)`, soft drop shadow, plus a faint inset top highlight for the
  "pane of glass" edge. Accent-tinted glass for active/primary surfaces.
- Depth hierarchy: canvas (opaque ink) → raised glass (cards) → floating glass (menus/modals:
  more blur + stronger shadow). Cap the number of stacked blur layers for perf; provide an
  opaque fallback where `backdrop-filter` is unsupported or `prefers-reduced-transparency` is set.

### Iconography
- One coherent icon family (lucide is in use): uniform stroke (1.75–2px), 20/24 optical sizes,
  consistent corner rounding, aligned to the text baseline. Replace mismatched/ad-hoc glyphs.
- Specialist/department icons are distinct and recognizable; active state picks up the accent.
  Icons read as one designed set, never clip-art. (Specialist avatars: see issue queue.)

### Graphs & data-viz
- A single charting language: thin lines, rounded caps, accent for the primary series, muted ink
  for secondary, mono tick labels, no chartjunk (no heavy gridlines/borders). Area fills are the
  accent at low alpha. Animate in (draw/grow) on mount, 220–320ms.
- Usage meters, voice-minute bars, build/usage stats, and billing all share this language.
  Tooltips are glass. Empty/loading chart states are on-brand (skeleton shimmer, not bare text).
- Prefer a light footprint (hand-rolled SVG or a small lib) — respect the console JS budget.

### Text bubbles (chat)
- Distinct user vs specialist treatment — not generic gray. Specialist messages: glass surface
  with a thin dept-accent edge + specialist chip; user messages: solid accent-tinted/inverted,
  right-aligned, clearly "yours". Generous reading measure (~68ch), tight vertical rhythm,
  first-class markdown/code (mono, syntax tint, copy button), and a beautiful streaming reveal.

### "AI is thinking / processing" (make latency feel fast & premium)
- The wait is part of the product — make it feel intelligent and quick, never a dead spinner.
  Staged: instant acknowledge (<100ms: composer disables, a message slot appears) → "thinking"
  (specialist chip + a refined animated indicator — shimmering dots / pulse / a thin accent
  progress shimmer, NOT a generic spinner) → token stream-in (smooth, soft caret).
- When known, show *what* it's doing in mono micro-copy ("routing to Engineering…", "reviewing
  your numbers…"). Multi-specialist round-tables show who's active. Keep motion subtle, fast,
  GPU-cheap. Optimistic + streaming so perceived latency is minimal.

## Rules for agents
- Read this + DESIGN.md before any /app UI PR. Build to THIS spec — coherence over cleverness.
- Reuse the token/spacing/type/component system; do NOT introduce one-off colors or values.
- Each PR: state the surface, before/after, confirm responsive at 375/768/1280, build + tsc green.
- Prefer migration-free work (pipeline can't apply migrations). Don't touch /finance.
- This is the founder's life's work and the part customers live in. Make it addictive. Make it fast.
