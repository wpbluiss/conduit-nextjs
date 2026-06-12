# DESIGN.md — Praxis UI Standard (read before any UI work)

**The bar:** every surface should look like a top-tier product team of senior designers + engineers shipped it — on par with or better than Linear, Vercel, Stripe, Arc, and ChatGPT/Claude. "Clean and consistent" is the floor, not the goal. If a screen looks like a default/bootstrap template, it's wrong.

## Identity
- **Ember single-accent on warm black.** Use the existing tokens in `src/styles/praxis-tokens.css` / `praxis-design-language.css`. No rainbow, no generic AI-purple. Centered, confident composition.
- Typography: deliberate scale + rhythm (Geist / JetBrains Mono per existing setup). Tight, intentional line-heights. No cramped or default spacing.
- Dark + light both first-class.

## Motion & feel (this is what makes it feel "$$$")
- Use **framer-motion** (already installed) for: scroll-reveal, staggered entrances, hover micro-interactions, smooth page/section transitions, and tasteful **parallax** on the marketing/landing surfaces.
- Motion must be *purposeful and fast* (150–400ms, good easing) — never janky, never gratuitous. Respect `prefers-reduced-motion`.
- Buttons/CTAs: a real system with hover/active/focus states, subtle depth, and satisfying feedback. CTAs should feel clickable and premium.

## Components
- Prefer the vendored **Watermelon UI** (`src/styles/watermelon.css`) and shadcn/Radix primitives already in the repo. You may adapt patterns from open-source libraries (Cult UI, Aceternity-style effects, Magic UI) **but** re-skin everything to the ember/PDL identity — never ship a foreign theme.
- Build a coherent component system: spacing scale, elevation, radius, states — reused, not one-off.

## What "great" includes (cover these, not just code)
- Marketing pages: hero with motion/parallax, social proof, crisp sections, strong CTAs, flawless responsive (375 / 768 / 1280).
- App shell: chat, sidebar, settings — polished empty/loading/error states, skeletons, transitions.
- **Transactional emails** (welcome, receipt, password reset): on-brand HTML templates, not plain text.
- Micro-everything: focus rings, hover, toasts, modals, 404/500.

## Rules
- Match existing patterns + tokens; don't fork the theme. Don't touch `/finance`.
- Every UI PR: include before/after notes and confirm responsive at 3 breakpoints. Build + typecheck green.
- When in doubt, raise the polish. This is the founder's life's work — treat it like a flagship.
