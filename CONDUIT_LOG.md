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

---

## Round 7 — Real Engineering execution + brevity pass (2026-05-06)

Branch: `feat/conduit-r7-engineering-execution` → merged to `main`.
Engineering goes from "describes what it would build" to "actually
ships working sites" via curated templates + GitHub + Vercel.

### Schema (migration `008_engineering_builds.sql`)

- `conduit_builds` — id, account_id, conversation_id, message_id,
  template_id, build_name, build_slug (UNIQUE), status (pending /
  building / live / failed / archived), github_repo_url,
  vercel_project_id, vercel_deployment_id, live_url, config jsonb,
  error_message, archived_at. RLS-on, owner-scoped.
- `conduit_build_events` — append-only progress log keyed by build_id.
  RLS-on (owners read).
- `conduit_artifacts` type CHECK widened to include 'build'.

### Build templates (5)

`src/lib/builds/templates/{landing-page,basic-crm,blog,lead-capture,
contact-form}.ts` — programmatic generators (function of customization
config → `Record<filepath, string>`). Each ships a working Next.js
16 + Tailwind 4 project that builds cleanly with reasonable defaults
even when Marketing isn't in the loop. `marketing_handoff` field on
each template flags which fields Marketing should fill before the push.

Shared scaffolding (`shared.ts`): tsconfig, next.config, gitignore,
postcss + tailwind config, base layout, base globals.css with the
Conduit visual identity (warm orange accent, deep slate, hairline
borders, rounded buttons).

### Executor (`src/lib/builds/executor.ts`)

- `executeBuild({templateId, buildName, config, onProgress})` →
  `{ok, buildSlug, liveUrl, repoUrl, vercelProjectId, ...}`.
- Steps emit `BuildEvent` types: plan_started, plan_done,
  marketing_briefed, customizing, repo_created, files_pushed,
  project_created, deploying, live, failed.
- GitHub: creates a public repo under `CONDUIT_BUILDS_GITHUB_OWNER`
  (default `wpbluiss`), with org-route + user-route fallback. Pushes
  files via the Contents API, base64-encoded.
- Vercel: creates a project linked to the GitHub repo via
  `gitRepository` — auto-deploys on link. Polls
  `/v6/deployments` every 4s for READY (max 5 min).
- `isEngineeringConfigured()` → graceful no-op when
  `VERCEL_API_TOKEN` and `GITHUB_PAT` (or `GITHUB_APP_TOKEN`) are
  missing. Engineering falls back to the descriptive R6 path.

### Chat route integration

Engineering branch in `runEmployee`: when employee = engineering AND
`isEngineeringConfigured()` AND `heuristicTemplateMatch(message)`
returns a template id, the route runs `runBuild()` instead of the LLM:

1. Inserts an intro assistant message ("On it. Building [template] for
   [account]. ETA ~Xs.") + creates `conduit_builds` row (status =
   building) + emits a `token` SSE event so the chat shows the intro.
2. If the template has `marketing_handoff` fields: focused Marketing
   `complete()` call asking ONLY for those fields as JSON. Strips
   code fences, parses, falls back to defaults on parse failure.
3. Calls `executeBuild()` with the merged config; pumps each
   `BuildEvent` to the client as a `build_event` SSE event AND
   inserts into `conduit_build_events`.
4. Updates `conduit_builds` row with status + URLs.
5. Inserts a final assistant message ("Done. Live at <url>. Repo at
   <url>. Want me to add anything?") + a `conduit_artifacts` row with
   `type='build'` carrying the live + repo URLs.

When env not configured OR no template match → falls through to LLM
(R6 descriptive path), so existing UX is preserved.

### Engineering employee prompt

Updated to acknowledge it can ship today via the template list. When
the request matches a template the platform handles it — Engineering
doesn't need to describe. When the request is custom, Engineering
sketches in 3-5 bullets and offers the template list as alternatives.
Provider-name discipline reinforced: never says "Vercel" or "GitHub"
— says "Live at <url>" / "Repo at <url>".

### Brevity tone pass (all 9 employees)

`src/lib/ai/employees/tone.ts` exports `withTone(body)`; every
employee's system prompt is now wrapped with the shared TONE_RULES
block prepended. Substance unchanged. Marketing/HR/Ops/Legal carry an
explicit note that the brevity rule applies to the chat preface only —
artifact bodies are still long-form when the request calls for it.

### UI

- **`/app/builds`** — grid of build cards with status pills (Pending /
  Building / Live / Failed / Archived), live URL, repo link, "Open
  chat" deep-link to the source conversation. Tier-locked Free
  accounts see a Pro-feature gate.
- **Sidebar** — new "Builds" item with `Hammer` icon between Artifacts
  and Settings. Shown only when account's tier permits Engineering
  (Pro+ or internal_account).
- **Settings → Usage** — added a "Builds · This cycle" stat tile to
  the top grid. 4-column layout instead of 3.

### API routes

- `GET /api/conduit/builds` (with `?archived=1` flag) — list user's
  builds.
- `GET /api/conduit/builds/[id]` — single build + event log.
- `PATCH /api/conduit/builds/[id]` body `{archived: bool}` — archive /
  unarchive.

### Required env vars

Build infrastructure is gated on:
- `VERCEL_API_TOKEN` — Vercel personal/team token (vercel.com/account/tokens).
- `GITHUB_PAT` (or `GITHUB_APP_TOKEN`) — repo:write scope on the org
  in `CONDUIT_BUILDS_GITHUB_OWNER`.
- `CONDUIT_BUILDS_GITHUB_OWNER` — defaults to `wpbluiss`.

Without these, `isEngineeringConfigured()` returns false. The chat
route detects this and skips the build branch entirely; Engineering
falls back to the descriptive path. The /app/builds page renders
fine with an inline banner ("Build provider not connected yet").

### Verification

- `npm run build` clean (24 routes total, +5 new).
- Migration 008 applied; tables + index verified in Supabase.
- Local: `/app` 307, `/app/builds` 307, `/api/conduit/builds` 401
  unauth — gates intact.
- Live build flow reserved for after Luis adds the env vars.

### What's NOT in this round

- Real Sales execution (lead lists, automated outreach) — **R8**
- Multi-user accounts — R9
- Cross-conversation memory layer — R10
- Open-ended Engineering execution via Claude Code subprocess + E2B/
  Modal sandbox — R11
- Voice full-duplex — R12

---

## Round 8 — Department workspaces + time-aware system prompts (2026-05-06)

Branch: `feat/conduit-r8-department-workspaces` → merged to `main`.
Every employee becomes a destination. The platform stops being "a chat
with employees" and starts being "the HQ where my team works."

### Schema (migration `009_account_timezone.sql`)

`conduit_accounts.timezone` text default `America/New_York`. Backfilled.

### Time-aware system prompts

`src/lib/ai/employees/time-aware.ts` — `withTimeAware(systemBody, {timezone})`
prepends a CURRENT TIME block to every employee prompt: full local time
+ part-of-day (morning / afternoon / evening / night). Threaded through
the chat route's per-turn prompt build and the onboarding welcome path.
The block instructs the model to match greetings to actual time and to
default to skipping greetings entirely (per R7 brevity rules).

### Workspace route (`/app/team/[employee]`)

Single dynamic page handles all 9. Validation: invalid id 404s; tier-
locked id redirects to `/app/settings?reason=workspace_locked&employee=<id>`.

Layout:
- **Header band** with department-color gradient, employee avatar (size
  56), name in dept color, role + tagline, "Talk to {name}" CTA tinted
  with the dept color.
- **Quick start** — 4 employee-specific prompt cards (defined in
  `src/lib/conduit/workspace-prompts.ts`). Each links to
  `/app?pin=<employee>&prompt=<encoded>`.
- **This cycle stats** — 3 tiles. For Engineering: "Builds shipped"
  (live builds in current cycle). For canExecute employees: "Artifacts
  produced." For non-execute employees: "Activity: Conversational"
  with an explainer line. Plus "Conversations" count + "Last active"
  relative time.
- **Recent activity** — last 10 mixed (artifacts produced + conversations
  responded in), sorted desc. Artifact rows open the drawer; conversation
  rows open the chat with `?c=`.
- **Empty state** — bespoke per-employee copy via `emptyStateCopy()`:
  Jarvis gets "You haven't checked in with me yet…", canExecute employees
  get "Marketing's ready when you are.", non-execute get
  "Sales hasn't run any plays yet…autonomous execution coming in a future
  update." Empty zone has a soft dept-color glow.

### Quick-start handoff

Chat client picks up `?pin=<employee>&prompt=<text>` on mount, sets the
pin state + prefills the input, then `window.history.replaceState` strips
the params so refresh doesn't re-trigger. Tier-restricted pins are silently
ignored.

### Sidebar restructure

Replaced the "Team status" panel with a "Team" navigation list. Each row
is now a `<Link>` to `/app/team/<id>` with a 2px dept-colored left bar
when active, the same ambient cycling pulse + streaming override from
R2.5. Tier-locked rows render at 50% opacity with a `Lock` icon and
redirect to `/app/settings` instead of the workspace.

### Settings → Profile timezone

Dropdown of common North America + Europe + Asia + Australia zones plus
the current value. Saves on change via new `/api/conduit/account/prefs`
endpoint. Time-aware prompt picks up the new value on next turn.

### Tier gating

- Free: Jarvis + Marketing workspaces accessible.
- Pro: + Sales + Engineering.
- Enterprise / internal_account: all 9.
- Direct deep-link to a locked workspace 302s to `/app/settings` with
  the upgrade reason in the query string.

### Verification

- `npm run build` clean (26 routes).
- Migration 009 applied.
- Local: `/app/team/<allowed>` 307→sign-in for unauth (expected); auth
  gate fires before tier check / 404, which is correct.
- Live workspace + time-aware test reserved for Luis after deploy.

### What's NOT in this round

- Real Sales execution (lead lists / automated outreach) — R9 (or
  multi-employee orchestration; Luis decides next)
- Cross-conversation memory layer — R10
- Voice full-duplex — R11
- Open-ended Engineering via Claude Code subprocess — R12
- Mobile (Expo) app — R13

---

## Round 9 — Round-table + conversation icons + voice UX cleanup (2026-05-06)

Branch: `feat/conduit-r9-roundtable-polish` → merged to `main`.

### Schema (migrations 010 + 011)

- `010_dominant_employee.sql` — `conduit_conversations.dominant_employee`
  text + `conduit_messages` `AFTER INSERT` trigger that recomputes the
  dominant employee per conversation. Conversations with 3+ distinct
  responders get `'team'` so the sidebar can render the multi-color
  round-table badge. Backfilled — 5 existing conversations populated.
- `011_voice_room_notify.sql` — `conduit_accounts.voice_auto_play`
  default flipped to `false` (existing rows unaffected) +
  `notify_voice_room_ready boolean DEFAULT false` for the Voice Room
  teaser opt-in.

### Round-table mode

`src/lib/ai/roundtable.ts` carries the routing logic:
- `isTeamQuery(message)` — heuristic: matches "everyone", "the team",
  "every department", "round table", "weigh in", "team standup",
  "team meeting", "each (of you|department|employee)", "intro yourselves".
- Explicit "team" pin via the new `Team round-table` option in the
  chat employee dropdown. (Type `PinValue = EmployeeKey | "auto" | "team"`.)
- `selectParticipants` caps parallel: Free/Pro = 4, Enterprise/internal
  = 8.
- `checkRateLimit` — module-level Map, 1 round-table per minute per
  account. Emits `round_table_rate_limited` SSE with retry hint when
  exceeded.

Chat-route flow when round-table fires:
1. Skip the single-employee path entirely.
2. Emit `round_table_start` with the participant list.
3. `Promise.all` over participants — each `complete()` call uses the
   employee's full system prompt (with R8 time-aware block) +
   `roundTableBrief()` constraining the response to "2-3 sentences,
   from your department's lens, no preamble." `max_tokens=350`.
4. As each settles, insert the assistant message (with
   `metadata.round_table=true`), log `conduit_usage_events`, increment
   the cap counter, and emit `round_table_response` SSE so the client
   reveals that bubble.
5. After all done, fire one Jarvis `complete()` with `synthesisBrief()`
   that takes the team responses and asks for a 3-5 sentence
   action-led synthesis. Emit `round_table_synthesis_start` then
   `round_table_synthesis`.
6. Final `round_table_end`.

UI in chat:
- `Team round-table — employees weighing in` banner at start.
- Each participant shows a pending bubble (typing dots in their dept
  color) which fills in when their response arrives.
- After all done, a `Synthesis from Jarvis` banner + Jarvis's bubble.
- Auto-play TTS (when enabled) plays each employee's voice
  sequentially — Marketing in Sarah, Sales in Adam, Engineering in
  Josh, Jarvis in Brian. Per-employee voice mapping was already
  configured in `src/lib/voice/defaults.ts`.
- Rate-limit emits a banner instead of any responses.

### Sidebar conversation icons

The Recent list now reads `dominant_employee` from each conversation row.

- `team` → multi-color conic-gradient dot (Marketing orange → Sales
  emerald → Engineering blue → Jarvis silver) — visually communicates
  "round-table happened in this convo."
- Single employee → small dept-color circle with the employee's
  initial.
- Falls back to Jarvis silver if the column is null.
- Active conversation's left-edge accent bar uses the dominant
  employee's color (not the generic accent).

The trigger keeps the column fresh on every assistant message insert,
so the sidebar reflects reality without an N+1 query per render.

### Voice preview bug fix

Root cause: ElevenLabs's `voice_settings.speed` parameter is honored
on Turbo v2.5 but rejected by some endpoints when set to the default
1.0 (as a redundant param). The endpoint also wasn't surfacing the
upstream status code, so any 4xx looked the same in the UI as
"Preview failed."

Fixes:
- `src/lib/voice/tts.ts` — `voice_settings.speed` now omitted entirely
  when it equals 1.0; passed only when the user customizes it.
  `voice_id` URL-encoded. Added an explicit `Accept: audio/mpeg`
  header. New `TTSUpstreamError` class carries the upstream status +
  body so the route can branch.
- `src/app/api/conduit/voice/preview/route.ts` now distinguishes
  `voice_unavailable` (404 on a specific voice) from `tts_failed`
  (everything else) and returns a user-facing message.
- `src/components/conduit/SettingsTabs.tsx` `preview()` handler reads
  the response message and shows it instead of the generic "Preview
  failed."

In-memory `previewCache` is keyed by `voice_id:employee` — no
deployment-stale entries (the cache is per-process and gets fresh
on every cold start).

### Voice settings UX cleanup

- Default `voice_auto_play=false` for new accounts (migration 011).
- Voice Room "Coming soon" card at the bottom of `/app/settings` →
  Voice tab. Notify-me button writes
  `notify_voice_room_ready=true` via `/api/conduit/account/prefs`
  (which now also accepts that field alongside timezone).
- Floating "Stop voice" button bottom-right when audio is playing.
  ESC key listener + `conduit:stopAudio` window event let any
  component cancel playback.

### Performance pass

- New `RouteProgress` component — 2px accent strip at top of `/app`,
  wipes left-to-right on every pathname change, fades out at ~480ms.
  Gives instant visual feedback on nav clicks even when the underlying
  fetch is fast. Mounted once in the app layout.
- `MessageBubble` wrapped in `React.memo` so streaming token
  appends don't force every prior message to re-render. (The streaming
  bubble's content is the only changing reference; `React.memo` skips
  the rest.)
- Existing Next.js `<Link>` prefetch (default behavior in 16) covers
  the workspace nav rows. Verified on the workspace page imports.

Note: the brief asked for SWR/React-Query workspace stat preloading
and broader memo audits. Those are valid follow-ups but introduce
new dependencies / state-management patterns; deferred to R9.5 along
with streaming TTS while text streams.

### What's NOT in this round (deferred)

- Streaming TTS while text streams — current behavior still synthesizes
  after a message completes. The architectural change (MediaSource
  pipeline) is meaningful enough to warrant its own round.
- Workspace stats prefetching to a client cache — defer until we add a
  cache library (SWR or React Query) intentionally.

### Verification

- `npm run build` clean (26 routes total — same as R8; no new public
  routes added since the round-table runs through the existing
  `/api/conduit/chat`).
- Migrations 010 + 011 applied; 5 existing conversations
  backfilled with `dominant_employee`.
- Local: routes return correct codes (`/app` 307 unauth, chat 401
  unauth on team pin).
- Live round-table reserved for Luis after deploy.

### What's NOT in this round (carried forward)

- Cross-conversation memory layer — R10
- Free-source lead generation (Maps scrape, public reviews) — R11
- Voice full-duplex (R5.5 promise) — R12
- Mobile app — R13
- Open-ended Engineering via Claude Code subprocess — R14

---

## Round 10 — Cross-conversation memory layer (2026-05-06)

Branch: `feat/conduit-r10-memory` → merged to `main`. Conduit stops
forgetting. Every account gets durable structured memory shared across
all conversations and all employees.

### Schema (migration `012_conduit_memory.sql`)

- `conduit_memory_kind` enum: `fact | preference | decision | goal | context`.
- `conduit_memory` table with `(account_id, kind, content, tags[],
  source_conversation_id, source_message_id, written_by,
  created_at, updated_at, archived_at, superseded_by)`. RLS-on,
  owner-scoped (`SELECT/INSERT/UPDATE/DELETE` policies).
- Two partial indexes for active-row queries:
  `(account_id, created_at DESC)` and `(account_id, kind)`.
- `conduit_pricing_tiers.memory_cap` — Free 25, Pro 200, Enterprise
  1000. `lib/billing/tiers.ts` mirrors. `internal_account` gets 5000.

### Memory write protocol — tag-based

Same convention as `[HANDOFF]` / `[ARTIFACT]`. Jarvis (and only Jarvis)
emits at the end of his response:

- `[REMEMBER: kind | content | tag1, tag2]`
- `[SUPERSEDE: <old_id> | kind | content | tags]`

`src/lib/ai/memory.ts` exports `parseMemoryWrites(content)` which
returns the cleaned `visibleContent` plus the extracted writes. The
chat route only runs the parser when `employee === 'jarvis'` — other
employees can't mutate memory even if they emit the tags. Jarvis's
system prompt now carries a `JARVIS_MEMORY_INSTRUCTIONS` block
explaining when to use these (durable facts / preferences / decisions
/ goals — not passing comments) and the format.

### System prompt injection

`renderMemoryBlock(memories)` produces a compact "WHAT YOU KNOW ABOUT
THIS USER AND BUSINESS" section grouped by kind (Facts, Context,
Preferences, Decisions, Goals). Hard caps: 40 records or 6000 chars
(~1500 tokens), whichever hits first via
`trimMemoriesForPrompt`. `renderMemoryBlock` returns "" when the
account has no memory (no wasted prompt budget on empty state).

The chat route loads the account's active memory rows once per turn
(60-row select) and prepends the block to every system prompt —
single-employee, round-table participant, and round-table synthesis
paths. Prompt caching (R2) keeps the cost flat across multi-turn
conversations.

### Tag execution + cap enforcement

After Jarvis's text streams in, the chat route:

1. Parses `[SUPERSEDE]` first. For each: verifies the `old_id`
   belongs to the account, inserts the new row, updates the old row
   with `archived_at + superseded_by`. Atomic at the row level.
2. Parses `[REMEMBER]`. For each: counts current active memories,
   archives oldest rows when over the tier cap to make room, then
   inserts the new row.
3. Emits `memory_written` SSE for each write with `{id, kind, content,
   tags, superseded_id?}`.

Source linkage: every write captures the conversation_id +
message_id of the Jarvis turn that produced it. The memory row
points back to the source for "jump to this conversation" UX.

### UI — Settings → Memory tab

New tab between **Voice** and **Usage**. Layout:
- Filter dropdown (All kinds / Facts / Context / Preferences /
  Decisions / Goals) + memory count `12 / 200`.
- Inline "+ Add memory" button reveals a manual-add form (kind picker
  + content textarea + tags input). Manual adds carry
  `written_by='user'`.
- Active memories grouped by kind in `Facts (3)`, `Preferences (2)`
  …, each row showing content, tag pills, byline, edit + archive
  controls. Inline edit toggle replaces the row with content +
  tags inputs and Save / Cancel buttons.
- Archive (× icon) soft-deletes via `PATCH archived=true` so the
  supersede chain stays intact.
- Bottom: collapsible "Show archived (N)" — read-only view.

### API routes

- `GET /api/conduit/memory` (with `?archived=1` and `?kind=` filters) —
  returns `{ memories, cap }`.
- `POST /api/conduit/memory` — manual add (`written_by='user'`).
  Enforces tier cap with 409 `memory_cap_reached`.
- `PATCH /api/conduit/memory/[id]` — edit kind / content / tags /
  archive flag.
- `DELETE /api/conduit/memory/[id]` — soft archive.

All routes account-scoped; RLS provides defense in depth.

### Onboarding prefill

When a new account submits the 3-step onboarding modal, the route
fires a single Haiku `complete()` call with strict JSON output asking
for 3-7 durable memory records extracted from the business profile.
Strips code fences, parses, validates each record's kind + content
length, persists (`written_by='jarvis'`). Idempotent: skips if the
account already has memory rows.

This means the very first message from a new user lands with seeded
context like "User runs Acme Cleaning, a commercial cleaning business
in Houston" and "User's main goal is landing 10 commercial contracts
this quarter."

### Chat client — inline memory pills

Streamed `memory_written` events attach to the latest Jarvis bubble
as a small pill: `KIND remembered · <content>`, accent-tinted
(rounded full, low-opacity accent bg, accent-color border). Renders
above the artifact card row so it's visible alongside any artifacts
from the same turn.

### Verification

- `npm run build` clean (28 routes total — +2 memory routes).
- Migration 012 applied; tier caps confirmed (Free 25, Pro 200,
  Enterprise 1000); `conduit_memory` table empty + RLS active.
- Local: routes return correct codes (`/app/settings` 307 unauth,
  `/api/conduit/memory` 401 unauth).
- Live cross-conversation memory test reserved for Luis after deploy.

### What's NOT in this round (carried forward)

- Free-source lead generation (Maps scrape, public reviews) — R11
- Voice full-duplex — R12
- Memory v2 with semantic search + auto-extraction from regular
  messages — R13 (when v1 hits its ceiling)
- Mobile (Expo) app — R14
- Open-ended Engineering via Claude Code subprocess — R15


## Round 11 — Free-source Lead Pipeline (2026-05-06 → -07)

Merged to main: `6190fa2`. Sales workspace at `/app/team/sales` is now
backed by real prospects sourced via OpenStreetMap Overpass (discovery,
free HTTP, no ToS friction), Reddit JSON endpoints (intent signals
scored 0-100 via Haiku), and Playwright + sparticuz/chromium on Vercel
for Maps rating/review enrichment of intent-flagged leads only. FB
groups cut entirely — Meta v. Bright Data is not the case to test.
21 real WPB+Boca+Delray+Jupiter med-spa leads pre-seeded via Overpass.
New tables: `sales_leads`, `reddit_lead_sources`,
`lead_intent_signals`. New API: `POST /api/sales/refresh-leads`,
`GET /api/sales/leads`, `PATCH /api/sales/leads`. Hard rate limits in
each scraper module (2s Overpass / Reddit / 3s Maps; 30 req/min).
Maps caps at 50 fetches/run, no UA rotation, no retry on bot wall.

## Round 12 — Voice Room (2026-05-07)

Merged to main: `b9dc053`. Full-duplex live voice via LiveKit Cloud
+ OpenAI Realtime (`modalities=['text']`, server VAD) + ElevenLabs
streaming TTS (`eleven_turbo_v2_5`, `pcm_24000`,
`optimize_streaming_latency=3`, `inactivity_timeout=180`). Voice
worker is a separate repo `wpbluiss/conduit-voice-worker` deployed
to Railway as a LiveKit Agents process; Vercel mints LiveKit tokens
at `/api/voice/token` and never touches Realtime/ElevenLabs (cost
isolation). New tables: `conduit_employee_default_voices`,
`conduit_voice_sessions`, `conduit_system_config`. Hard ceilings
enforced server-side: 300s/session, 240s warn, 30min/day per
account (internal_account exempt). Memory writes back through
worker-secret-gated `/api/voice/memory-write` so R10 invariant
stays sealed. Polish round (R12 polish branch) added an inbound
audio-energy gate + 800ms cooldown on the worker so spurious
`user_speech_started` events from VAD jitter never cancel the
agent's response, plus tightened VAD knobs and slowed ElevenLabs
delivery to 0.85x. Container CA-certs added so the rtc-node
`/settings/regions` HTTPS fetch can complete TLS handshake on
Railway. Verified live by Luis: Jarvis voice ID
`UgBBYS2sOqTuMpoF3BR0` (Mark - Natural Conversations) speaks,
audio path is end-to-end functional. ElevenLabs Starter tier
required — free tier returns `payment_required` on streaming WS.

## Round 13 — Streaming TTS in Text Chat (2026-05-07)

Merged to main: `5e2d568`. Audio for text chat now starts within
~500-900ms of the first sentence completing instead of waiting
8-12s for the full response. The chat SSE stream multiplexes audio
chunks alongside token deltas. New shared lib `/lib/voice/streaming-tts.ts`
ports the worker's ElevenLabs WS contract into the Vercel side
(eleven_turbo_v2_5, pcm_24000, optimize_streaming_latency=3,
inactivity_timeout=180); chat-tts.ts is the per-request bridge —
prepares a config (one batched DB read for prefs + voice overrides
+ today's char usage), opens a per-employee TTS WS in
`streamForEmployee()`, exposes `onDelta` / `finish` / `cancel`
to the chat route. Sentence segmenter inside streaming-tts handles
sentence-boundary detection and end-of-stream tail flush.
Client-side `voice/streamingAudio.ts` is a tiny module-scoped Web
Audio queue: decodes base64 PCM16, schedules each chunk after the
previous one ends, supports `stopAll` for typing-stops-audio.
Migration 015 adds `accounts.streaming_tts_enabled` (default true),
`conduit_voice_chat_sessions` usage log, and a system_config row
for the daily 50k char ceiling (internal_account bypasses).
Settings UI toggle deferred — runs ON by default with prefs gating.

## Round 12.5 (partial) — Voice Round-Table Plumbing (2026-05-07)

Merged to main: `fabf31b`. Data plumbing only — migration 016
adds `mode` enum + `participants` jsonb to `conduit_voice_sessions`,
adds `voice_session_id` to `conduit_conversations` so a voice
session can deeplink to its originating text chat. `/api/voice/token`
extended to accept `mode` ('solo' | 'roundtable'), `participants`
(string[] of employee_ids), and `conversation_id`. Validates
participant count against tier (2 free / 4 pro / 8 enterprise /
unlimited internal), forces Jarvis as moderator, blocks tier-locked
participants. Resolves voice_id for ALL participants up-front and
packs them into the LiveKit AccessToken metadata. Worker rewrite
(N parallel Realtime sessions, Haiku routing classifier on user
transcript, per-participant LiveKit tracks) and the multi-avatar
UI redesign were intentionally NOT shipped — the architecture has
real branching points (Realtime fan-out cost vs single-Realtime
tagged routing, routing latency budget) that need a hands-on call
with the user before code lands.



## Round 12 Polish — VAD + ElevenLabs Knobs (2026-05-07)

Merged to main as part of bad063c. Diagnosed mid-utterance
self-cancel (agent cuts itself off after 5-8 words). Three layered
fixes: (1) tightened OpenAI Realtime server_vad knobs (threshold
0.7 to 0.8, prefix_padding 600 to 700, silence_duration 500 to 600);
(2) 800ms cooldown after each agent utterance starts that
suppresses any user_speech_started event firing in the early
window; (3) inbound-audio-energy gate that only honors interrupts
when the user mic track carried RMS > 0.005 within the last 200ms.
Both gates log "suppressed" reasons so future diagnosis can read
the cause directly from Railway logs. ElevenLabs voice speed
dropped from 0.9 to 0.85 for a calmer pace.

## Voice ID Auto-pick (2026-05-07)

Merged to main as ae6ad9e. Eight stock ElevenLabs voices selected
for the non-Jarvis employees, applied via UPDATE on
conduit_employee_default_voices, validated against the project
voice library. Per-pick reasoning in docs/voice-picks.md. Sales=
Adam (dominant tenor), Engineering=Eric (agentic tenor),
Marketing=Jessica (warm bright), Finance=Matilda (knowledgeable
alto), Compliance=Daniel (steady broadcaster), HR=Lily (velvety
British), Ops=Charlie (Australian energy), Legal=George (warm
British storyteller). All 9 rows now have non-null voice_ids.

## Jarvis-name Audit (2026-05-07)

Merged to main as dde0d23. 197 references inventoried across both
repos in docs/JARVIS_REFERENCES.md, categorized (code constants
ts/tsx, system prompts, DB seeds, UI strings, comments, docs). NO
code changes. Includes a rename order-of-ops guide. Calls out the
public.jarvis_* tables that belong to other projects in the same
Supabase instance and must NOT be touched.

## Round 13 Polish — Streaming TTS Toggle (2026-05-07)

Merged to main as f7ac3e1. Added a Streaming audio toggle to
/app/settings -> Voice. /api/conduit/voice/prefs GET returns
streaming_tts_enabled; POST accepts it. Wires to
account.streaming_tts_enabled from migration 015. Tooltip:
"Audio plays sentence-by-sentence instead of waiting for the
full response. Lower latency, slightly higher cost."

## Round 12.5 Worker — Round-table with Haiku Routing (2026-05-07)

Merged to main as b65d8c7 (frontend) and worker 94c5603.
Architecture call: shipped Option B — single Realtime + single
rotating ElevenLabs WS + Haiku router per turn.

Worker (conduit-voice-worker):
- src/router.ts: Haiku classifier with abortable controller,
  isTeamTrigger() for round-robin trigger phrases.
- src/system-prompts.ts: buildRoundTablePrompt() per-turn variant
  with brevity coda; employeeDisplayName() for transcript labels.
- src/openai-realtime.ts: autoCreateResponse option (default
  true keeps solo behavior), updateInstructions() for mid-call
  prompt swap, createResponse({ instructions }) for manual
  triggering with per-call instructions override.
- src/agent.ts: SessionState carries participantVoices map +
  isRoundTable. dispatchRoundTable runs on user_transcript when
  mode=roundtable. runSingleTurn aborts current TTS, opens fresh
  WS with chosen employee voice, publishes active_speaker, fires
  response.create. runRoundRobin sequences non-jarvis 1-sentence
  turns then jarvis closer. roundRobinAborted + routerAbort flip
  on user_speech_started for clean interrupt mid round-robin.

Frontend (conduit-nextjs):
- VoiceRoom mode === roundtable renders participant row with
  active-speaker highlight; listens for active_speaker data
  events; transcript labels by speaker.
- VoiceModeButton extended with optional mode + participants +
  conversationId + participantDisplays + label.

Deferred to next session: chat-header Voice mode trigger that
builds participants from active conversation, and Bring-in-
employee modal for upgrading solo to roundtable in place. Both
need careful Chat.tsx integration.


## Round Brand-1 — Atlas + Praxis Rename (2026-05-07)

Merged to main as feat/conduit-rename-atlas-praxis. Foundational
rename round before R14 mobile + Q3 HQ. Brand architecture locked
across the company:

- **Conduit** = parent company (marketing site stays at
  conduitai.io)
- **Praxis** = product family (formerly "Conduit AI")
  - Praxis Console — web app (`/app`, formerly chat-first)
  - Praxis Mobile — R14 (Expo, TestFlight)
  - Praxis HQ — Q3 (3D headquarters)
- **Atlas** = Chief of Staff (formerly Jarvis)

DB enum value `jarvis` is preserved as the Chief of Staff identifier
to avoid a migration cascade. Display name, function names, prompt
text all reference Atlas.

Code changes:
- `EMPLOYEES.jarvis.name` = "Atlas", initial "A"
- `jarvisSystemPrompt` → `atlasSystemPrompt` (file kept as
  `jarvis.ts` to match the enum value)
- `JARVIS_MEMORY_INSTRUCTIONS` → `ATLAS_MEMORY_INSTRUCTIONS`
- `friendlyErrorFor` covers all 9 employees; fallback is "Atlas"
- `previewLineFor("jarvis")` returns "Hi, I'm Atlas..."

UI changes:
- /app sidebar wordmark: Conduit → Praxis
- Chat: pin labels ("Atlas (auto-route)", "Atlas only"),
  EmptyState ("Talk to Atlas. He routes..."), suggestions
- OnboardingModal: "Praxis · Step X of 3", "Tell Atlas...",
  "Meet Atlas" CTA, "Briefing Atlas...", footer "Praxis · By
  Conduit"
- SettingsTabs: voice room copy, memory empty state

Marketing surface (minimum-impact pass; R3 is the full rewrite):
- layout.tsx metadata: "Conduit AI" → "Conduit", new tagline
  "Intelligence at work."
- Navbar + Footer wordmarks: drop "AI" suffix
- Story timeline + body copy

API routes:
- Onboarding welcome conversation title: "Welcome to Conduit"
  → "Welcome to Praxis"
- Handoff brief header: "Brief from Atlas"

Historical CONDUIT_LOG entries reference Jarvis verbatim; this is
intentional (history is what it was). Forward-looking docs use
Atlas.



## Round Brand-2 — Praxis Console Redesign (2026-05-07)

Merged to main as ed7d577 (final commit). Console moved from chat-first
to a section-based dashboard layout matching Anthropic Console / OpenAI
Platform density.

### New routes
- `/app/workspace` — default landing after sign-in. Welcome line,
  4 dashboard cards (Atlas pinged you / Pipeline / Last conversation /
  Voice minutes today, all real RLS-scoped data), and a 9-employee team
  grid with last-active stamps.
- `/app/analytics` — three weekly summary cards + coming-soon block.
- `/app/voice` — voice room landing with daily/per-session caps,
  employee picker, and recent voice sessions list.
- `/app/settings/{profile,voice,memory,billing,team}` — sub-routes that
  render the existing tabbed UI with a different `defaultTab` prop, so
  bookmarks land on the right tab without a URL flicker.

### Sidebar
Replaces the flat sidebar with section-based nav: Workspace, Team
(collapsible employee list), Voice Room, Leads, Memory, Builds,
Analytics. Recent conversations list moved below primary nav. Bottom
area: Settings, Billing, Sign out, account email, "Praxis Flow ·
<tier>" tier label.

### Employee workspaces
- Added a new `EmployeeRightRail` component (server-side, fetches its
  own data) — About / Recent context (last 3 memory notes) / Quick
  actions (deep-links into chat with `?pin=&prompt=`).
- Wired into both `/app/team/[employee]` and the Sales workspace.
- Visible on lg+ screens; hidden on tablet and mobile so the main
  surface stays usable.

### Settings
- New "Team" tab is a placeholder for personality tuning + a pointer
  back to per-employee voice picks (which still live in Voice).
- `loadSettingsData(supabase, user)` extracts the shared loader so each
  sub-route page is a thin wrapper.

### Auth
Sign-in default redirect: `/app` → `/app/workspace`. Existing chat URLs
(`/app?c=<id>`) still work since `/app` keeps its current chat surface.

