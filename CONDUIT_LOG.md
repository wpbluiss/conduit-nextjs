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

---

## Round 2.5 — Life pass (2026-05-06, post-R2)

Branch: `feat/conduit-r25-life-pass` → merged to `main`.

Two buckets only: kill the chat ring + add ambient warmth/presence.

### What changed

**Chat ring: removed.** The faint outer-glow ring tracing the chat panel
came from three places, all stripped:

- `.conduit-pill-input:focus-within` had a 4px `box-shadow: 0 0 0 4px rgba(255,138,61,0.08)` outer halo. Now: border-color change only on focus, no shadow.
- `.conduit-suggestion:hover` had a 1px outer ring + 24px blurred glow. Now: subtle background tint + border color + 1px translate, no shadow.
- `EmployeeAvatar` had Tailwind `ring-1` on top of an inset `box-shadow` overlay (double ring). Collapsed to a single inset shadow on the avatar itself; removed the absolute-positioned overlay span.

Files: `src/app/globals.css` (3 rule blocks), `src/components/conduit/EmployeeBadge.tsx` (avatar).

**Ambient warmth.**

- `.conduit-canvas` adds a radial gradient at top-left, 5% accent mixed into the surface, fading to plain surface by 60%. Applied only to `<main>` — sidebar stays cold. (`src/app/app/layout.tsx`)
- `.live-dot` keyframe animation: pulsing green dot used as the prefix on "Your team is online" eyebrow.
- `.hero-fade-in`: 320ms fade + 6px-rise on first paint of the empty state.
- `.presence-line`: 2.4s ease-in-out fade loop for "Marketing is thinking…" line under the input while streaming.

**Team Status panel — alive.**

- "Online" / "Active" labels replaced with a single small dot on the right of each row (gray = idle, dept-color = streaming).
- Default state: each dot runs an `ambientPulse` keyframe, cycling — Jarvis (delay 0s), Marketing (3s), Sales (6s), Engineering (9s), looping every 12s. So one dot is always pulsing.
- Streaming override: when an employee is currently responding (Chat dispatches `conduit:stream` CustomEvent, Sidebar listens), that dot switches to `teamDotStreaming` — stronger, steady, 1.1s cycle — until done.

**Empty state.**

- Eyebrow now reads "🟢 Your team is online · {firstName}" (live-dot before).
- Hero shifted to "What are we building today?" to match strategy doc.
- Suggestion cards: hover swaps to a 6% mix of the department color over surface (no outer ring/glow), lifts 1px.

**Bubbles.**

- User bubble: `border-radius: 22px 22px 22px 6px` — rounded-3xl on the right edge, small corner bottom-left for speech-bubble feel.
- Assistant bubble: mirrored — `22px 22px 6px 22px`, small corner bottom-right.

**Hover affordances.**

- Conversation rows in sidebar: 100ms transition, hover bg = 8% accent over transparent. Active conversation gets a 2px accent left-edge bar (positioned absolute, top 1.5/bottom 1.5, rounded-full).
- Bottom nav (Artifacts, Settings, Sign out): same hover bg.

### Verification

- `npm run build` clean.
- Local dev: `/` 200, `/auth/sign-in` 200, `/app` 307→sign-in.

### What's NOT in this round

- No new features
- No 3D / parallax / loud animations
- No new design libraries
- No schema or API changes

---

## Round 3 — Adaptive routing + Marketing UX fix + Creator Mode v2 (2026-05-06)

Branch: `feat/conduit-r3-adaptive` → merged to `main`.

### Marketing UX fix (PREFLIGHT)

Bug: when Marketing produced an `[ARTIFACT]` block, the chat-visible
message rendered as just `---` after the artifact strip. Two changes:

- `src/lib/ai/employees/marketing.ts` — system prompt now requires a
  1-2 sentence preface BEFORE the `[ARTIFACT]` block. Three example
  prefaces in the prompt; explicit "NEVER lead with horizontal rules
  (---) or empty content."
- `src/lib/ai/parse.ts` — defensive fallback in `parseArtifacts`. When at
  least one artifact is parsed and the remaining visible text is empty,
  whitespace, just `-*_=` separator characters, or under 10 characters,
  the visible body is replaced with "Done. Artifact ready — open below
  or in /app/artifacts."

### Conduit Adaptive — intent-based routing

New file: `src/lib/ai/intent-classifier.ts`. Classifies each user message
into one of `routing | creative | reasoning | code | factual` via a
small Haiku call (max 8 output tokens). Cheap heuristics short-circuit
before the API call: messages under 24 chars → routing, Engineering →
code, Marketing → creative. In-process LRU caches the last 50
classifications keyed by `${employee}::${first 200 chars}`.

`provider.ts` `modelForEmployee()` now takes `intent` + `creatorMode` +
`creatorModeVersion` and returns one of Opus 4.7 / Sonnet 4 / Haiku 4.5
per the matrix:

| Tier | reasoning | code | creative | routing | factual |
|---|---|---|---|---|---|
| Standard (Free / Pro) | Sonnet 4 | Sonnet 4 | Haiku 4.5 | Haiku 4.5 | Haiku 4.5 |
| Creator Mode v1 (legacy) | Haiku 4.5 | Haiku 4.5 | Haiku 4.5 | Haiku 4.5 | Haiku 4.5 |
| Creator Mode v2 (Luis daily) | **Opus 4.7** | **Opus 4.7** | Sonnet 4 | Sonnet 4 | Sonnet 4 |

Engineering is forced to Sonnet on standard tier even on routing intent
(baseline before R6 real execution).

Chat route classifies the user's message once per turn, then per-employee
intent shaping kicks in: Marketing always treated as `creative`,
Engineering always `code`, all others carry the user's classified intent.
Intent + chosen model are written to `conduit_usage_events.metadata`
(`intent`, `user_intent`).

### Creator Mode v2

Migration `004_creator_mode_v2.sql` adds `creator_mode_version integer
DEFAULT 1`. Owner (`luisinvestments101@gmail.com`) flipped to v2 — Opus
4.7 default with Sonnet fallback.

Settings → Profile shows a "Creator Mode v2 — premium routing" pill when
`creator_mode = true`.

### Pricing table updated

`src/lib/ai/pricing.ts` adds Opus 4.7 ($15/$75 per MTok). Estimator
keeps the 0.10× cached-read and 1.25× cache-write multipliers.

### Cost impact

- Owner messages: depends on intent. Routing turns from R2 (Haiku
  $1/$5) → Sonnet ($3/$15, ~3× cost). Strategic / multi-step turns from
  Haiku → Opus ($15/$75, ~15× input / ~15× output). This is intentional —
  Luis dogfoods Opus quality on every strategic turn.
- Customer (non-creator-mode) messages: identical to R2 except now
  reasoning + code intents bump from Haiku to Sonnet — the right thing
  for quality, ~3× cost on those turns only. Routing/creative remain on
  Haiku, which is the bulk of conversational volume.
- The 1-Haiku-call classification adds ~50-150 input + ~1-2 output
  tokens per user message. ~$0.0001 per message. Functionally free.

### Verification

- `npm run build` clean (Next.js 16.2.2, Turbopack).
- Migration 004 applied; Luis row confirmed `creator_mode_version=2`.
- Local dev: `/`, `/auth/sign-in`, `/auth/sign-up` 200; `/app` 307; chat
  401 unauth.
- Live intent classification + cost spot-check reserved for Luis's first
  R3 turn after deploy (couldn't simulate end-user auth here).

### What's NOT in this round

- Stripe billing — queued for R4
- New employees — R6
- Cross-provider routing (OpenAI / Perplexity / Groq) — stubbed; R5+
- Multi-step planner / executor / reviewer — R3+ (next-next; not this PR)

---

## Round 4 — Stripe billing, tiers, paywall (2026-05-06)

Branch: `feat/conduit-r4-billing` → merged to `main`.

### Schema (migration `005_billing.sql`)

- `conduit_pricing_tiers` — Free / Pro / Enterprise rows with model_ceiling,
  monthly_token_allowance, allowed_employees, features, stripe_price_id slot.
- `conduit_accounts` gets `tier_id`, `stripe_customer_id`,
  `stripe_subscription_id`, `subscription_status`, `bonus_tokens`,
  `internal_account`. Owner row updated to `tier_id='enterprise'`,
  `internal_account=true`, `subscription_status='active'` so creator_mode v2
  routing keeps working without paywall noise.
- `conduit_stripe_events` — webhook idempotency log (RLS-on, service-role only).
- `conduit_token_topups` — pending/succeeded/failed rows keyed by
  payment_intent_id, owner-readable via RLS.

### Stripe wiring (build complete, runtime gated on env)

- `lib/billing/tiers.ts` — source-of-truth tier config. Top-up options
  (`$10→500k`, `$25→1.5M`, `$50→3.5M`). `modelExceedsCeiling` and
  `ceilingDowngrade` helpers.
- `lib/billing/stripe.ts` — lazy-init Stripe client via
  `STRIPE_SECRET_KEY`. Returns `BILLING_NOT_CONFIGURED` if missing so
  unrelated paths don't crash. Stripe SDK v22.1.1.
- `POST /api/conduit/billing/checkout` — creates Stripe Customer (with
  `account_id` metadata) on first call, opens Checkout in
  `subscription` or `payment` mode based on body. Returns `{ url }`.
  Returns 503 if Stripe not configured.
- `POST /api/conduit/billing/portal` — Billing Portal session for
  account.stripe_customer_id. 503 if unconfigured, 400 if no customer yet.
- `POST /api/conduit/billing/webhook` — verifies signature against
  `STRIPE_WEBHOOK_SECRET`, dedupes via `conduit_stripe_events` table,
  uses service-role client to bypass RLS. Handles
  `checkout.session.completed` (subscription tier flip OR top-up grant
  with bonus_tokens increment), `customer.subscription.updated` (status
  + tier sync), `customer.subscription.deleted` (downgrade to free),
  `invoice.payment_failed` (mark past_due), `invoice.paid` (no-op).

### Tier enforcement

- `provider.ts` `modelForEmployee()` now takes `tierCeiling` +
  `internalAccount`. Internal accounts bypass the ceiling. Otherwise the
  chosen model is clamped down to Haiku/Sonnet/Opus per tier ceiling.
- Chat route emits `paywall_required` SSE event:
  - `cap_reached` (tokens_used ≥ allowance + bonus) — blocks the turn,
    Chat opens PaywallModal pre-pinned to the top-ups view.
  - `employee_locked` — Free user pinning Sales/Engineering. Blocks.
  - `model_locked` — Free user with reasoning/code intent. Emits warning
    but proceeds on the downgraded Haiku so the user still gets an answer.
- `internal_account=true` skips all three checks. Luis sees nothing.

### UI

- `components/conduit/PaywallModal.tsx` — Pro / Enterprise upgrade cards
  side-by-side, "Or top up tokens" toggle reveals the three top-up
  options, error states for `billing_not_configured` /
  `tier_price_not_configured`. Suppressed entirely for internal accounts
  via the `internalAccount` prop on `<Chat>`.
- `components/conduit/SettingsTabs.tsx` Billing tab fully rebuilt:
  - Internal-account view: "No charge, full access" pill + usage summary,
    no upgrade UI.
  - Standard view: current plan card with "Manage in Stripe" button when
    the account has a stripe_customer_id, usage progress bar (amber 80%,
    pink 100%), 3-tier comparison cards with Upgrade buttons, top-up
    grid with Buy buttons.
- `components/conduit/UpgradeNudge.tsx` — dismissible banner above /app
  shown only to Free, non-internal accounts. Persists dismissal in
  localStorage under `conduit_upgrade_nudge_dismissed`.

### Pricing

| Tier | Monthly | Tokens | Model ceiling | Employees |
|---|---|---|---|---|
| Free | $0 | 50k | Haiku | Jarvis + Marketing |
| Pro | $29 | 1M | Sonnet | + Sales + Engineering |
| Enterprise | $199 | 5M | Opus | + Finance/HR/Ops/Legal/Compliance (when shipped) |

Top-ups: $10→500k, $25→1.5M, $50→3.5M (one-time, stack on monthly).

### Verification

- `npm run build` clean (Next.js 16.2.2, Turbopack)
- Local: `/` 200, `/auth/sign-in` 200, `/app` 307→sign-in,
  `POST /api/conduit/billing/checkout` 401 unauth,
  `POST /api/conduit/billing/webhook` 503 (webhook secret not configured
  locally, expected).
- Migration 005 applied. Luis: `tier_id=enterprise`,
  `internal_account=true`, `subscription_status=active`.
- Live Stripe flow (test card 4242…) deferred — requires Luis to:
  1. Create Pro + Enterprise products in Stripe (test mode), copy
     price_ids.
  2. Create Top-up $10 / $25 / $50 one-time products, copy price_ids.
  3. Add `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`,
     `STRIPE_WEBHOOK_SECRET`, plus `STRIPE_PRICE_PRO_MONTHLY` /
     `STRIPE_PRICE_ENTERPRISE_MONTHLY` / `STRIPE_PRICE_TOPUP_10` /
     `..._25` / `..._50` to Vercel (production + preview).
  4. Configure a Stripe webhook endpoint pointing to
     `https://www.conduitai.io/api/conduit/billing/webhook` listening
     for `checkout.session.completed`,
     `customer.subscription.{updated,deleted}`, `invoice.{paid,payment_failed}`.
  5. Test the 4242 card flow end-to-end in production.

The code path is wired and gated — the moment those env vars land, the
Free → Checkout → Pro flow flips on without further code changes.

### What's NOT in this round

- Voice mode (R5)
- Twilio phone numbers (R5)
- Real Engineering / Sales execution (R6)
- Multi-user accounts (R7)

---

## Round 5 — Voice mode (push-to-talk v1) (2026-05-06)

Branch: `feat/conduit-r5-voice` → merged to `main`. Push-to-talk only — true full-duplex deferred to R5.5/R6.

### Schema (migration `006_voice.sql`)

- `conduit_accounts` gets `voice_enabled` (default false), `voice_speed`
  (numeric 3,2, default 1.00, clamped 0.50–2.00), `voice_auto_play`
  (default true).
- `conduit_employee_voices` table — per-account override
  `(account_id, employee) → elevenlabs_voice_id`. RLS-on, owner-scoped.

### Voice config (`src/lib/voice/`)

- `defaults.ts` — `DEFAULT_EMPLOYEE_VOICES` map of stock ElevenLabs IDs
  (Brian / Sarah / Adam / Josh for Jarvis / Marketing / Sales /
  Engineering, plus reserved IDs for the future five). `VOICE_NAMES`
  lookup. `previewLineFor(employee)`.
- `tts.ts` — `streamTTS({text, voiceId, speed})` calling ElevenLabs Turbo
  v2.5 with `optimize_streaming_latency=2`, mp3_44100_128 output. Throws
  `VOICE_NOT_CONFIGURED` if `ELEVENLABS_API_KEY` unset. `fetchVoices()`
  with 1h memory cache.
- `pricing.ts` — `voiceCostCentsForChars(chars)` (~$0.33 / 10k chars).

### API routes

- `POST /api/conduit/voice/tts` — auth + tier gate. 403 `voice_locked`
  for Free unless `internal_account`. Streams ElevenLabs response back
  as `audio/mpeg`. Logs `conduit_usage_events` with
  `metadata.voice = { provider, characters, voice_id }` and
  `estimated_cost_cents`.
- `GET /api/conduit/voice/voices` — returns ElevenLabs voice list (or
  the static fallback if `ELEVENLABS_API_KEY` missing). Reports
  `configured` flag so UI can show a banner.
- `POST /api/conduit/voice/preview` — `{voice_id, employee}`. 24h
  in-memory cache keyed by `voice_id:employee` so re-clicking preview
  doesn't re-bill. 403 for Free unless internal.
- `GET / POST /api/conduit/voice/prefs` — read/save voice toggles +
  speed + per-employee voice overrides (upserts `conduit_employee_voices`).

### Browser STT (`src/hooks/useSpeechRecognition.ts`)

Wraps Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`).
Fields: `supported`, `listening`, `transcript`, `error`, `start`,
`stop`, `reset`. Falls back gracefully — disabled mic button with tooltip
when unsupported (Safari iOS partial, Firefox no support).

### Chat UI

- New mic button between the input textarea and the circular send
  button. Click toggles listening. While listening: button switches to
  filled accent state with `employee-pulse` animation, placeholder reads
  "Listening…", transcript fills the input live. Click again → stop +
  auto-submit.
- After each assistant message ends (`message_end` SSE event) AND
  `voice.enabled` AND `voice.autoPlay` AND `voice.ttsAllowed`: chat
  fetches `/api/conduit/voice/tts` with the visible content + employee,
  pipes audio through a single `<audio>` element. Speaking indicator
  next to employee badge: 3-bar wave animation in dept color, click
  to stop. Replay button (`▶ Listen`) on past messages while voice
  is allowed.
- New CSS keyframes `wave1/wave2/wave3` in `globals.css`.

### Settings → Voice tab

New tab between "Business" and "Usage". Free tier sees a Pro-feature
gate with "voice input still works in chat" copy. Pro+ sees:

- Master toggle: enable voice mode.
- Auto-play toggle.
- Playback speed slider (0.5×–2.0×, saves on pointerup).
- Four employee cards (dept-colored left accent) with a voice dropdown
  + Preview button + "Reset to default" link. Default voice always
  pinned at top of the dropdown. Voice list fetched from
  `/api/conduit/voice/voices` on mount.
- Banner when `ELEVENLABS_API_KEY` missing — settings still save,
  previews disabled.

### Tier gating recap

| Path | Free | Pro / Enterprise / internal |
|---|---|---|
| Voice input (browser STT) | ✅ | ✅ |
| Audio output (TTS) | ❌ 403 voice_locked | ✅ |
| Voice tab in Settings | locked overlay | full |
| `internal_account=true` | bypasses everything | bypasses everything |

### Cost tracking

`conduit_usage_events` rows for voice carry
`provider='elevenlabs'`, `model='eleven_turbo_v2_5'`,
`metadata.voice.characters`, and an `estimated_cost_cents` derived from
the char count. Settings → Usage donut already surfaces "by employee"
spend; voice events flow through the same aggregation.

### Verification

- `npm run build` clean.
- Local: `/` 200, `/app` 307, voice routes 503 / 401 as expected without
  `ELEVENLABS_API_KEY` set locally.
- Live audio test deferred — requires `ELEVENLABS_API_KEY` on Vercel.
  Fallback path verified: voice routes return 503
  `voice_not_configured`, voice list returns the static defaults so
  Settings UI doesn't break.

### What's NOT in this round

- Full-duplex (interrupt / cut-in / VAD) — R5.5 / R6
- Whisper-based STT — R5.5 / R6
- Twilio phone numbers — R6
- Voice in mobile app — R9

---

## Round 6 — Full team: Finance, Compliance, HR, Operations, Legal (2026-05-06)

Branch: `feat/conduit-r6-full-team` → merged to `main`. STRATEGY.md
calls for 9 employees across 9 departments. R1 launched 4. R6 ships
the missing 5.

### Central employee config

`src/lib/conduit/employees.ts` is now the single source of truth — id,
name, role, color, soft color, initial, tagline, canExecute, voice
category. UI components (EmployeeBadge, Sidebar, SettingsTabs Voice
panel), Jarvis routing prompt, intent classifier, tier allowlist, and
voice defaults all read from here.

### Five new employees (system prompts in `src/lib/ai/employees/`)

| Employee | Color | Default intent | Can produce artifacts |
|---|---|---|---|
| Finance | warm gold #EAB308 | reasoning | no (R7+) |
| Compliance | violet #A855F7 | reasoning | no (R7+) |
| HR | rose #EC4899 | creative on writing keywords, else routing | yes (job descs, handbooks, offer letters) |
| Operations | teal #14B8A6 | routing | yes (SOPs, checklists, process docs) |
| Legal | navy #3B82F6 | reasoning | yes (NDAs, contracts, with attorney-review disclaimer baked in) |

Compliance carries an explicit PHI-handling disclaimer ("PHI processing
is gated until you sign a BAA"). Legal mandates the attorney-review
disclaimer — non-negotiable, baked into both the prompt and the
artifact body.

### Jarvis routing update

System prompt's routing decision tree now lists all 8 routable
employees + Jarvis self-handle. Jarvis also receives
`allowed_employees` + `tier_id` in the system context — when a tier
locks an employee, Jarvis self-handles instead of emitting a HANDOFF,
with one warm "[Employee] would normally take this — they're available
on a higher plan" sentence. No paywall-shame.

### Intent classifier short-circuits

- Marketing → creative (existing)
- Engineering → code (existing)
- Finance / Compliance / Legal → reasoning (new)
- HR → creative when message hits writing keywords (job description,
  handbook, offer letter, rubric, interview guide, write/draft/post/
  listing), else routing (new)
- Ops → routing (new)

### Provider model selection

- `EmployeeKey` widened to all 9.
- `modelForEmployee()` on standard tier:
  - Engineering → Sonnet baseline (R7 unlocks real exec)
  - Legal + Compliance → Sonnet baseline (accuracy non-negotiable)
  - Others → intent-driven (Sonnet for reasoning/code, Haiku for
    creative/routing/factual)
- Per-employee max_tokens defaults: Finance/Compliance 1200, HR 3000,
  Ops 2000, Legal 3000.

### Sidebar Team Status

Now renders all 9 in a 2-column grid. Ambient pulse cycles through 4
slots (delay 0/3/6/9s); employees in slots 5-9 share the cycle via
modulo. Tier-locked employees render at 50% opacity with a Lock icon
and "Available on a higher plan" tooltip. internal_account = all 9
fully active.

### Empty-state suggestions

`SUGGESTION_POOL` carries 8 entries; `suggestionsForTier` shows the 4
best for the account's allowed employees, always prioritising Jarvis +
Marketing. Free sees Jarvis + Marketing + 2 fallbacks (still Marketing-
focused). Pro adds Sales/Engineering. Enterprise adds Finance / Legal /
HR / Ops options.

### Pin selector dropdown

Filtered to allowed employees per tier. Dropdown only shows what the
tier permits.

### Tier enforcement (defense in depth)

- Migration `007_tier_employees_v2.sql`: refreshed
  `conduit_pricing_tiers.allowed_employees` arrays — Free 2, Pro 4,
  Enterprise 9.
- `lib/billing/tiers.ts` Enterprise allowedEmployees synced to all 9.
- Chat route still emits `paywall_required reason='employee_locked'`
  when a non-internal account tries to talk to a locked employee
  (existing R4 logic, unchanged).
- `/api/conduit/voice/tts` route now checks tier allowlist after the
  Free-tier gate so a Pro user can't synthesize Finance audio.

### Verification

- `npm run build` ✅ clean (16 routes, Next.js 16.2.2 Turbopack).
- Migration 007 applied; tier rows confirmed: Free [jarvis, marketing],
  Pro [jarvis, marketing, sales, engineering], Enterprise [all 9].
- Local: routes return correct codes (`/app` 307, chat 401 unauth).
- Live multi-employee routing test reserved for Luis after deploy.

### What's NOT in this round

- Real Engineering execution (Claude Code subprocess) — **R7**
- Real Sales execution (lead lists, outreach automation) — R7+
- Multi-user accounts — R8
- Twilio phone numbers — R8
- Real Finance reconciliation, real Legal e-sign workflows — R9+
