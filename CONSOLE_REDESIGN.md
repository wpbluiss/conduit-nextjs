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

## Rules for agents
- Read this + DESIGN.md before any /app UI PR. Build to THIS spec — coherence over cleverness.
- Reuse the token/spacing/type/component system; do NOT introduce one-off colors or values.
- Each PR: state the surface, before/after, confirm responsive at 375/768/1280, build + tsc green.
- Prefer migration-free work (pipeline can't apply migrations). Don't touch /finance.
- This is the founder's life's work and the part customers live in. Make it addictive. Make it fast.
