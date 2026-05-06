# Conduit Build Log

## Round 1 — Chat Platform Shell (2026-05-06)

Branch: `feat/conduit-chat-shell-v1` → merged to `main`.

### Shipped

**Database**
- Supabase migration `001_conduit_initial.sql` applied to project `mvuslmfjkkuizixjpkgl`.
- 5 new tables, all RLS-on, scoped by `account_id` / `owner_user_id`:
  `conduit_accounts`, `conduit_conversations`, `conduit_messages`,
  `conduit_artifacts`, `conduit_usage_events`.
- Security advisors: no conduit-related findings.

**AI layer**
- `src/lib/ai/provider.ts` — provider-agnostic interface (`complete`,
  `streamComplete`). Anthropic implemented; OpenAI/Together/Groq stubs reserved.
  Model assignments: Sonnet 4 for Jarvis + Engineering, Haiku 4.5 for Marketing
  + Sales. Model is selected per-employee, not per-call-site.
- `src/lib/ai/employees/{jarvis,marketing,sales,engineering}.ts` — per-employee
  system prompts, account context interpolation.
- `src/lib/ai/parse.ts` — `[HANDOFF]` and `[ARTIFACT]` tag parsing.
- `src/lib/ai/pricing.ts` — token cost estimator.

**API routes** (all auth-gated via Supabase session cookie)
- `POST /api/conduit/chat` — SSE-streaming. Routes through Jarvis by default,
  honors `employee_override`, parses handoffs and artifacts, inserts messages
  + artifacts + usage events.
- `GET/POST /api/conduit/conversations`
- `GET/DELETE /api/conduit/conversations/[id]`
- `GET /api/conduit/artifacts`
- `GET/DELETE /api/conduit/artifacts/[id]`
- `POST /api/conduit/onboarding` — saves business fields, generates Jarvis
  welcome message, returns conversation id.

**UI**
- `/app` — sidebar (conversations list, artifacts, settings, sign out) +
  streaming chat with employee badges, handoff transitions, artifact preview
  cards, side drawer with copy/download.
- `/app/artifacts` — grid of all artifacts with deep links back to convo.
- `/app/settings` — profile / business / usage tabs (billing = coming soon
  stub). Usage tab shows month-to-date tokens, cost, by-day bar chart, by-employee.
- 3-step onboarding modal triggers on first `/app` visit.
- `/auth/sign-in`, `/auth/sign-up`, `POST /auth/sign-out` — Supabase Auth
  email + password.

**Marketing site**
- Navbar: added "Sign in" link + replaced "Request Access" CTA with "Talk to
  Conduit" → `/auth/sign-up` (mobile menu mirrors).
- Hero CTA: "Request Access" → "Talk to Conduit" → `/auth/sign-up`.
- New `<PlatformTeaser>` section below hero with the locked copy and "Sign
  up free" CTA.
- All other marketing content untouched.

**Infra**
- `src/proxy.ts` — Supabase session refresh proxy (Next 16 renamed
  middleware → proxy).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` added to Vercel (production + development).
  Existing `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_KEY` reused.

### Branding rules enforced

- No "Claude / Anthropic / GPT / OpenAI" strings anywhere user-facing. Errors
  use `friendlyErrorFor(employee)` ("Jarvis is taking a moment, try again").
- Provider is logged internally to `conduit_usage_events.provider` only.

### Deviations from brief

- Brief said `app/...` paths; repo uses `src/app/...` (path alias `@/*` →
  `./src/*`). Followed repo convention.
- Brief said `lib/ai/...`; placed at `src/lib/ai/...` for the same reason.
- Next.js 16 deprecated `middleware` file in favor of `proxy` — used
  `src/proxy.ts`.
- Brief asserted `ANTHROPIC_API_KEY` already exists in this Vercel project.
  It does not (it's on the lunaro-nextjs project, not conduit-nextjs).
  **Action required from Luis**: add `ANTHROPIC_API_KEY` to the conduit-nextjs
  Vercel project before chat will respond. Without it, the chat endpoint
  returns a friendly "taking a moment" error and inserts no message.

### Round 2 queue

- Voice + phone (Twilio + ElevenLabs)
- Real execution for Engineering (subprocess builds)
- Real execution for Sales (lead lists, automated outreach)
- Stripe billing on `conduit_usage_events`
- Mobile (Expo) app reusing API
- Multi-user accounts (invites)

---

## Round 2 — Polish, Cost, Verify (2026-05-06, ~5:30 PM session)

Branch: `feat/conduit-r2-polish-cost` → merged to `main`.

### R1 verification findings

- Luis's `conduit_accounts` row was correctly created and onboarded.
- `ANTHROPIC_API_KEY` was missing on the conduit-nextjs Vercel project at first
  chat attempts (20:48–20:57). Three of his early user messages have no
  assistant follow-up because the streaming generator threw silently.
- Welcome message at 20:47 fired the static fallback path (correct behavior
  given missing key).
- After the key was added, Jarvis responded successfully at 21:15 (560-char
  reply), but **no `conduit_usage_events` row was inserted** — bug in the
  streaming usage-capture path (relied on `message_delta` events whose timing
  was unreliable). 0 artifacts ever produced (no Marketing flow tested).

### Cost optimization

- **Default model swapped to Haiku 4.5 for Jarvis, Marketing, Sales.**
  Engineering keeps Sonnet 4 (will need it when it executes for real in R6).
- **Anthropic prompt caching** wired on the system block via
  `cache_control: { type: 'ephemeral' }` in `lib/ai/provider.ts`. Both
  `complete()` and `streamComplete()` now log `cache_read_input_tokens` /
  `cache_creation_input_tokens` to `conduit_usage_events.metadata`. Pricing
  table includes 0.10× cached-read and 1.25× cache-write rates.
- **Per-employee `max_tokens` caps**: Jarvis 800, Marketing 4000, Sales 600,
  Engineering 1200. Removes the 2048/4096 split.
- **`creator_mode` flag** (migration `002_creator_mode.sql`) on
  `conduit_accounts`. When true, every employee runs on Haiku regardless of
  role. Seeded `true` for `luisinvestments101@gmail.com`. Threaded through
  `provider.ts` via `metadata.creatorMode`.
- **Per-account monthly token cap** (migration `003_token_caps.sql`):
  `monthly_token_cap`, `monthly_tokens_used`, `billing_cycle_start`. Chat
  route pre-checks before each completion; emits SSE `limit_reached` event if
  exhausted; increments `monthly_tokens_used` after every completion. Cycle
  rolls automatically once `billing_cycle_start + 30d` has elapsed
  (`rollBillingCycleIfDue`). Luis seeded with 5M cap.

### Bug fixes

- **23505 race on `/app` first-load**: `getOrCreateAccount` now uses an
  atomic `upsert(..., { onConflict: 'owner_user_id', ignoreDuplicates: true })`
  followed by a re-select.
- **Unreliable usage-event capture**: `streamComplete()` now reads usage
  from `await stream.finalMessage()` so input + output + cache counts are
  always populated. The chat route inserts a usage row unconditionally
  (even on 0/0) so failures stay visible instead of disappearing.
- **Onboarding welcome path**: now passes `creatorMode` and writes a usage
  event for the welcome turn; static fallback still kicks in if generation
  fails so the onboarding flow never breaks.

### Visual identity

- **Color tokens**: added `--color-dept-{jarvis,marketing,sales,engineering}`
  + soft variants. Jarvis silver/platinum, Marketing warm orange (matches
  accent), Sales emerald, Engineering cool blue. Surface tones deepened
  (`--color-surface-raised`, `--color-border-soft`). Accent shifted to
  `#FF8A3D`. Buttons rounded (`14px`).
- **Sidebar**: tighter spacing, rounded item rows. New "Team status" panel
  shows 4 employee dots with department colors and a pulse ring when the
  employee responded in the last 60s.
- **Chat input**: pill-shaped (rounded-full), 60px tall, employee selector
  rendered as an inline chip on the left with employee avatar + name, send
  button is a circular accent-colored icon button.
- **Message bubbles**: user is right-aligned with accent-tinted bg + asym
  rounded corners; assistant is left-aligned with a 2px department-colored
  left border + employee badge above. Streaming shows 3 pulsing
  department-colored dots while empty, then the cursor caret while writing.
- **Handoff transition**: full-width animated bar with the receiving
  employee's avatar + color and "Marketing is taking this from here". Fades
  in via `handoffSlide`.
- **Artifact preview cards**: department-colored 3px left accent, square
  icon tile, "Open in drawer →" CTA. Drawer is now slate elevated, larger
  type, copy + download in header.
- **Empty state on `/app`**: "Welcome back, [first_name]" eyebrow + "What's
  the team working on today?" hero. Suggestion cards take department color
  variables — hover = colored ring + soft glow, eyebrow tinted to dept.
- **Onboarding** is now a full-screen takeover with progress bar at top.
  Three steps slide in via fade. Final pre-redirect step "Setting up your
  team…" with three pulsing accent dots before the welcome conversation
  loads.
- **Settings → Usage**: Today / This week / This month stats grid with
  cost prominent. Token-cap progress bar (turns amber at 80%, pink at 100%).
  14-day bar chart in a card. Custom SVG donut split by employee with a
  legend showing percentage shares.
- **Artifacts page**: cards have department-colored left accent, icon tile
  in dept tint, content preview line. Empty state replaced with magnetic
  copy "Nothing here yet. Marketing's ready when you are." + Marketing
  avatar + "Start a conversation →" CTA.
- **Subtle motion**: typing dots, employee avatar pulse while streaming,
  handoff slide-in, onboarding fade. All respect `prefers-reduced-motion`
  via existing globals.css rules.
- **What we did NOT change**: marketing site, auth flow, design libraries
  (still only Tailwind + Lucide; no Recharts — donut + bars hand-drawn in
  SVG/CSS).

### Estimated cost reduction

Before R2, default Jarvis turn used Sonnet 4 ($3 in / $15 out) with a
~600-token system prompt sent on every turn. After R2:

- Sonnet → Haiku for Jarvis/Marketing/Sales: **input ~67% cheaper, output
  ~67% cheaper** ($1 in / $5 out vs $3 / $15).
- Prompt caching: system prompt billed at 1.25× on the first turn of a
  conversation, then 0.10× on every subsequent turn within the 5-min
  ephemeral window — **a ~90% input-token cost cut on multi-turn
  conversations** for the cached portion.
- Per-employee max_tokens caps prevent runaway 2048/4096 outputs on
  conversational replies.
- Net: a typical 5-turn Jarvis conversation should cost roughly **15–20% of
  pre-R2** (model swap × cache reuse × shorter output cap). Engineering
  conversations cost the same (still Sonnet) but only fire when explicitly
  pinned or Jarvis routes there.

### Verification

- `npm run build` clean (Next.js 16.2.2, Turbopack)
- Local `/`, `/auth/sign-in`, `/auth/sign-up` → 200; `/app` → 307; chat 401
  unauth.
- Supabase `conduit_*` advisors clean (no new lints introduced by
  002/003 migrations).
- Live chat verification (Marketing handoff producing real artifact) is
  reserved for Luis's first message after this deploy — couldn't simulate
  end-user auth from this session.

### R3 queue confirmed

R3 ships Stripe billing wired to `monthly_token_cap` + a top-up flow.
R4 voice, R5 phone numbers, R6 real Engineering/Sales execution, R7
multi-user accounts, R8 integrations (MCP per business), R9 Expo mobile,
R10 Projects/Design/Customize tabs.
