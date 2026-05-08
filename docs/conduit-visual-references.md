# Conduit Visual Overhaul — Reference Synthesis

> **Purpose:** Anchor the visual overhaul in concrete references so every design move
> can be traced to a benchmark. The bar is "would Geist Studio (Anthropic) or Rauno
> Freiberg (Linear) ship this." If a section can't trace back here, redo it.

> **Date:** 2026-05-08 · **Branch:** `feat/conduit-visual-overhaul-2026-05-08`

---

## 1 — Anthropic (anthropic.com)

**What they do**

- Sans-serif display at large scale; weight + size carry hierarchy, not chrome.
- Neutral warm foundation. Single subtle accent. No gradient mosh-pits.
- Generous whitespace between sections — confidence is communicated by the gap,
  not by a divider line.
- Card grid for product family ("Claude Opus 4.7", "Claude is a space to think",
  "Claude on Mars") — consistent padding and alignment. Trust through grid rhythm.
- Institutional language: "public benefit corporation", safety framing. The
  language *is* the design move.
- Geist illustrations: muted ochre/warm-cream palette, geometric not skeuomorphic,
  hand-feel without preciousness.

**Steal**

- **Restraint**. Cut decorative elements 40% from instinct, then cut another 20%.
- Generous body line-height (1.6–1.7). Whitespace > shadow.
- Card-based product family with consistent padding rhythm (Section 2 of homepage).
- Institutional copy: "running on Praxis", not "powered by Praxis".

---

## 2 — Stripe (stripe.com)

**What they do**

- Animated wave/ribbon gradient as signature hero element — not background
  texture, *brand identity*. Flowing forms beat geometric.
- Three-zone nav: primary (Products / Solutions / Devs / Resources), utility
  (Pricing, Sign in), CTAs (Start now, Contact sales). Different audiences served
  in the same shell.
- **Data-forward design**: numbers get typographic weight equal to copy. "135+",
  "$1.9T", "99.999% uptime" become visual anchors.
- Customer wall: monochromatic logos, consistent spacing, infinite carousel.
- Alternating section layouts (text-left/image-right → image-left/text-right) creates
  visual momentum without surprise.
- Full-width case study cards with 2–3 metric callouts.
- Footer: multi-column taxonomy — product family / solution verticals / resource
  buckets / legal compliance. Shows breadth.

**Steal**

- Hero ember radial gradient = our wave. Distinct, signature, not generic mesh.
- **Stat callouts** in /customers/lunaro: "200+ contacts · 6 pipelines · 9 employees ·
  weeks to ship" — large numbers, small captions.
- 5-column footer with proper taxonomy (Praxis / Company / Engineering /
  Customers / Resources). No flat link list.
- Case study card pattern for Lunaro — full-width, 2–3 stats, single quote.

---

## 3 — Linear (linear.app)

**What they do**

- Dark-first marketing. The Linear app is dark; the marketing site doesn't fight it.
- Numbered section progression: "1.0 Intake", "2.0 Plan", "3.0 Build", "4.0 Diffs",
  "5.0 Monitor". Forward-momentum cognitive scaffolding.
- Hierarchical repetition for emphasis — same headline repeated at varying weights,
  not multiple competing headlines.
- Product screenshots delivered at 2× DPR with `q=95`, scale-down fit. UI shots
  are crisp, not blurry.
- Generous whitespace surrounding UI samples. The frame breathes.
- Restrained accent — Linear uses near-monochrome with a single muted purple/pink
  highlight. The discipline is what reads as premium.
- Rauno's micro-interactions: cursor-tracked hover states, subtle parallax, motion
  curves that feel mechanical (eased-in-out-quart) not bouncy.

**Steal**

- Dark-first treatment confirmed for all marketing pages (Console stays light).
- Numbered sections for /approach: "01 — On specialization", "02 — On memory" …
- Single-accent discipline: ember-500 is the only chromatic flourish. Resist
  rainbow gradients.
- Cursor-glow on primary CTAs (desktop only, reduced-motion respected).
- ease-out-quart for everything; banish bouncy springs.

---

## 4 — Linear /method (linear.app/method)

**What they do**

- Single column, generous prose width. Long-form manifesto.
- Three pillars: Introduction → Direction (4 subsections) → Building (6
  subsections). Hierarchical numbered outline.
- Manifesto voice — "There is a lost art of building true quality software."
  Recovers lost discipline rather than inventing new framework. Authority through
  moral clarity.
- Short descriptive labels paired with section numbers — feels authoritative
  without verbosity.
- Pull-quotes / italicized lines break prose rhythm.
- No imagery on the page. Type *is* the design.

**Steal — directly into /approach**

- Single column, max-width 720px (we already plan this).
- Numbered sections: 01–06 mapping to specialization / memory / voice / execution
  / next decade.
- Italic Fraunces pull-quotes between sections, ember-500 vertical accent line on
  left of quote.
- Manifesto voice: "We think payroll is a transitional state, not a permanent
  one" rather than "Praxis enables modern teams to streamline workflows."

---

## 5 — Vercel (vercel.com)

**What they do**

- Dark-first with light alternates (dual SVG asset pattern). They invest in
  rendering both themes well.
- Hero: bold sans-serif headline + supporting subhead + dual CTAs (primary
  "Deploy" + secondary "Get a Demo").
- Buyer segmentation in nav: Developers (Docs, Academy, Templates, frameworks)
  vs Business (Enterprise, Pricing, Customers, Contact Sales). Same shell, two
  audiences.
- Customer logos paired with quantified impact ("95% reduction in page load
  times", "24× faster builds"). Logos alone are wallpaper; with metrics they are
  evidence.
- Code/terminal blocks with gradient frame treatment — TypeScript snippets in
  syntax-highlighted blocks bordered by gradient ring. The code itself is the
  hero asset.
- Animated mesh backgrounds on product imagery — depth via gradient layers, not
  drop-shadows.
- Footer broken into semantic buckets: Get Started / Build / Scale / Secure /
  Resources / Learn / Frameworks / SDKs / Use Cases / Company / Community.

**Steal**

- Dual CTAs in our hero ("Open Praxis Console →" primary + "See the product
  family" secondary).
- Code-block with gradient frame for Section 6 (the Praxis Engineering proof —
  the "Generated by Praxis Engineering today" block).
- Lunaro logo + quantified impact line on the homepage hero customer row.
- Mesh backgrounds for hero + final CTA. Layered radial gradients, ember + violet
  undertone, very subtle.

---

## 6 — Mercury (mercury.com)

**What they do**

- Warm dark cinematic. Deep charcoal/near-black + warm accent (their gold
  ≈ our ember). The warmth is the brand.
- Custom Arcadia typeface for display headlines. Distinctiveness through type.
- 3–2 alternating section rhythm: wide hero / focused feature card / wide hero.
- Hybrid illustration + product screenshot — abstract minimal illustrations
  (geometric, flowing lines) balance product UI shots.
- Card treatments: subtle elevation, refined 1px borders, slight inner gradient
  for depth — never heavy box-shadow. Lift via ring-glow.
- Product framing shows task completion in flow, not isolated feature lists.
  "10-minute application, seconds-to-complete transactions" — the screenshot
  carries the narrative.

**Steal**

- Warm dark palette confirmed: ink-canvas `#0A0908` + ember `#D67817` is our
  Arcadia-gold equivalent. Sister brand to Lunaro's eclipse purple, not a twin.
- Card depth via inset ring + soft outer ember-glow on hover, never box-shadow.
- Console screenshot in Section 1 framed in glass with ember-glow ring, parallax
  on scroll.
- Hybrid illustration + screenshot strategy: Phosphor-stroke marks for product
  cards (geometric, ember-tinted), real Console UI for hero/proof sections.

---

## Conduit Design DNA — The Synthesis

Pulling the sharpest move from each into our visual identity:

1. **Anthropic restraint** — every section earns its decoration. Cut, then cut.
2. **Stripe data-forward** — numbers carry the same weight as copy. Stats are
   the visual anchor in customer proof.
3. **Linear dark-first + numbered manifesto** — dark canvas, numbered /approach
   sections, single-accent discipline.
4. **Vercel code-as-hero** — Section 6 of homepage: real code in a gradient-framed
   block proves Praxis Engineering ships.
5. **Mercury warm cinematic** — ember as our gold, warm cream over pure white,
   ring-glow over box-shadow, hybrid illustration + screenshot.

### The Conduit move (what's only ours)

- **Ember radial top-right** in every hero — signature gradient that says "warm
  AI, not cold AI". Distinct from Anthropic's neutral, Linear's near-mono, Stripe's
  ribbon, Vercel's developer green, Mercury's gold.
- **Fraunces × Inter × JetBrains Mono trio** — serif display + sans body + mono
  for code/captions/credits. Three voices, one personality.
- **9-employee specialization framing** — every product page references the
  workforce metaphor (specialist over generalist). No competitor frames AI this way.

### The non-negotiable rules

- Phosphor only (never Lucide) on marketing surfaces. Stroke 1.5.
- Warm cream `#F5EFE6` over pure white. Never `#FFFFFF` text on dark.
- ease-out-quart `cubic-bezier(0.25,1,0.5,1)` for all motion. No bounce.
- Respect `prefers-reduced-motion` on every animation, every hero particle,
  every parallax.
- Dark-first marketing only. The /app Console redesign stays light, untouched.
- No founder bio, no "21 years old", no "no CS degree", no "built in public",
  no "one founder on a laptop". West Palm Beach in the footer is the only
  personal-geography reference, and that lives in the legal-band copy.

---

## Quality bar — final check before shipping each phase

> **Would Geist Studio ship this? Would Rauno Freiberg ship this?**
> If you hesitate, redo the section.

Specific tells we're under-baking:

- "Looks fine" instead of "feels designed"
- Centered everything (Stripe and Anthropic both alternate)
- One gradient color (Mercury and Vercel layer ember + violet undertones)
- Lucide icons sneaking in from old code
- "21 years old" or "solo founder" framing anywhere
- Stock photography of any kind
- Anywhere a stranger could not tell whether this is a 100-person company or
  a solo build

The visitor should land at conduitai.io and within 5 seconds think
**"what is this, who built this"** — not "cool startup", not "another AI wrapper".
A real company shipping real things.
