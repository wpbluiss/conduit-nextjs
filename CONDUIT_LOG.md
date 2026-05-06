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
