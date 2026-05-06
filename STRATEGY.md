# Conduit AI — Round 1: Chat Platform Shell
## Created 2026-05-06 ~4:00 PM, for execution this evening

## Mission
Ship Conduit's first customer-facing surface: a chat platform at `conduitai.io/app` where a user signs up, talks to Jarvis (chief of staff), and gets routed to AI employees who do real work. By end of session, Luis can log in to his own conduitai.io domain, talk to Jarvis, and have the Marketing employee actually generate real blog posts.

**Read first:** `STRATEGY.md` at the root of the repo. That's the source of truth for what Conduit is. Every decision below executes against that doc.

**Don't ask Luis questions** — every decision is locked. Don't fabricate credentials. Don't expand scope mid-session.

---

## Pre-flight

1. Confirm working directory: `~/conduit-nextjs`
2. Confirm `STRATEGY.md` is at the repo root. If not, Luis will commit it before the session starts.
3. Read `AGENTS.md` and `CLAUDE.md` for any existing repo conventions.
4. Branch from main:
   ```
   git checkout main && git pull
   git checkout -b feat/conduit-chat-shell-v1
   ```

---

## Verified context

- Repo: `wpbluiss/conduit-nextjs`, deploys to Vercel as `conduitai.io`
- Supabase project: `mvuslmfjkkuizixjpkgl` (shared with Lunaro). New schema namespace: tables prefixed `conduit_*` to avoid collision with `lunaro_*`.
- Marketing site is the existing root (`/`). Chat platform mounts at `/app/*` (authenticated routes).
- Anthropic API key exists in Vercel env (`ANTHROPIC_API_KEY`) — already configured for Lunaro, reusable here.

---

## Strategic decisions locked

These are not up for re-derivation. If something seems wrong, flag in the status report — don't change.

- **Surface:** `conduitai.io/app` inside the existing repo. Single deploy. Marketing site stays at `/`.
- **Auth:** Supabase Auth on existing project. Email + password to start. No SSO this round.
- **AI Employees in v1:** Jarvis, Engineering, Marketing, Sales. (Finance/Compliance/HR/Legal/Ops exist as concepts but don't ship UI tonight.)
- **Execution depth tonight:** UI chat works for all 4 employees. Jarvis routes. Marketing is the one employee that *actually executes* (generates real blog posts). Engineering and Sales respond conversationally describing what they would do — real execution comes in Round 2/3.
- **Voice / phone number:** deferred to Round 2.
- **Model provider:** Anthropic Claude tonight, but ALL model calls go through a `lib/ai/provider.ts` abstraction so we can swap providers (OpenAI, Together, Groq, fine-tuned) with one config change later.
- **Branding:** Users see "Jarvis," "Marketing," "Sales," "Engineering." Users do NOT see "Claude," "Anthropic," or any provider branding anywhere in the UI.

---

## TASK 1 — Database schema (Supabase migrations)

Create migration file in `supabase/migrations/` (or wherever the repo's migration convention is). Name: `001_conduit_initial.sql`.

```sql
-- Accounts (a user's Conduit workspace; one per user for v1, multi-user later)
CREATE TABLE conduit_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  business_type text, -- free text from onboarding ("cleaning", "real estate", etc.)
  business_description text, -- free text from onboarding
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (owner_user_id)
);
ALTER TABLE conduit_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_full_access" ON conduit_accounts
  FOR ALL USING (owner_user_id = auth.uid());

-- Conversations (a chat thread; user can have many)
CREATE TABLE conduit_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  title text, -- auto-generated from first message
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX ON conduit_conversations (account_id, updated_at DESC);
ALTER TABLE conduit_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "account_members_full_access" ON conduit_conversations
  FOR ALL USING (account_id IN (SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()));

-- Messages within a conversation
CREATE TABLE conduit_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conduit_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  employee text, -- 'jarvis', 'marketing', 'sales', 'engineering', or null for user messages
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb, -- routing decisions, tool calls, artifacts, etc.
  created_at timestamptz DEFAULT now()
);
CREATE INDEX ON conduit_messages (conversation_id, created_at);
ALTER TABLE conduit_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "account_members_full_access" ON conduit_messages
  FOR ALL USING (
    conversation_id IN (
      SELECT c.id FROM conduit_conversations c
      JOIN conduit_accounts a ON a.id = c.account_id
      WHERE a.owner_user_id = auth.uid()
    )
  );

-- Artifacts produced by AI employees (blog posts, code, plans, etc.)
CREATE TABLE conduit_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES conduit_conversations(id) ON DELETE SET NULL,
  message_id uuid REFERENCES conduit_messages(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('blog_post', 'document', 'code', 'plan', 'image', 'other')),
  title text NOT NULL,
  content text NOT NULL, -- markdown / plain text / code
  produced_by text NOT NULL, -- which employee made it
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX ON conduit_artifacts (account_id, created_at DESC);
ALTER TABLE conduit_artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "account_members_full_access" ON conduit_artifacts
  FOR ALL USING (account_id IN (SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()));

-- Token usage tracking (foundation for billing later)
CREATE TABLE conduit_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  employee text NOT NULL,
  provider text NOT NULL, -- 'anthropic', 'openai', etc.
  model text NOT NULL,
  input_tokens integer DEFAULT 0,
  output_tokens integer DEFAULT 0,
  estimated_cost_cents integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX ON conduit_usage_events (account_id, created_at DESC);
ALTER TABLE conduit_usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_read" ON conduit_usage_events
  FOR SELECT USING (account_id IN (SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()));
```

Apply via Supabase MCP `apply_migration`. Run `Supabase:get_advisors type=security` after.

---

## TASK 2 — Model abstraction layer (`lib/ai/provider.ts`)

Build a single interface so swapping providers later is trivial.

```typescript
// lib/ai/provider.ts
export type ProviderName = 'anthropic' | 'openai' | 'together' | 'groq';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CompletionRequest {
  messages: ChatMessage[];
  systemPrompt: string;
  maxTokens?: number;
  stream?: boolean;
  metadata?: { employee?: string; accountId?: string };
}

export interface CompletionResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  provider: ProviderName;
  model: string;
}

export async function complete(req: CompletionRequest): Promise<CompletionResponse> { /* ... */ }
export async function streamComplete(req: CompletionRequest): AsyncGenerator<string> { /* ... */ }
```

Implementation notes:
- Default provider: Anthropic, model `claude-sonnet-4-20250514` for Jarvis (smart routing) and Engineering (heavier reasoning), `claude-haiku-4-5-20251001` for Marketing and Sales (fast + cheap for content + conversational).
- Read provider choice from env var `CONDUIT_DEFAULT_PROVIDER` (default 'anthropic').
- Stream via SSE for real-time UI.
- After every completion, write a row to `conduit_usage_events` with token counts and estimated cost (use Anthropic's published pricing for now; add a helper `estimateCostCents(provider, model, inputTokens, outputTokens)`).
- All API errors caught + returned as user-friendly messages ("Jarvis is taking a moment, try again"). NEVER expose provider names in error messages.

---

## TASK 3 — AI Employee definitions (`lib/ai/employees/`)

Each employee gets its own file with system prompt + capabilities.

### `lib/ai/employees/jarvis.ts`
```
Role: Chief of Staff. The first point of contact. Routes work to other employees.

System prompt:
"You are Jarvis, [user_name]'s Chief of Staff at their company [account.name]. The user runs a [account.business_type] business: [account.business_description].

Your job:
1. Greet the user warmly. Be conversational, sharp, occasionally funny — like a brilliant COO who's been with the user for years.
2. Listen to what they need. Ask 1-2 clarifying questions if the request is vague, but don't over-question.
3. Decide which employee should handle the request:
   - Marketing: content, social posts, ads, blog posts, SEO, brand
   - Sales: prospecting, outreach, calls, closing, lead pipeline
   - Engineering: building tools, websites, CRMs, automations, integrations
   - Yourself: strategic questions, status updates, summaries, decisions, prioritization
4. When routing, end your response with a structured handoff in this exact format on its own line:
   [HANDOFF: marketing | sales | engineering]
   ...followed by a short brief to the receiving employee on its own line:
   [BRIEF: <2-3 sentence brief>]
5. If the user's request is purely strategic/conversational, no handoff — just respond yourself.
6. NEVER mention Claude, Anthropic, GPT, or any provider. You are Jarvis. The other employees are also AI but the user doesn't need to think about that.
7. Keep responses tight. Founders are busy. No fluff.

Style: Confident. Direct. Warm. Slightly British in cadence (the Jarvis from Iron Man — but professional, not cartoonish)."
```

### `lib/ai/employees/marketing.ts`
```
Role: Marketing department. Generates real content (blog posts, social posts, ad copy, email campaigns).

Capabilities (TONIGHT):
- Generate blog posts (markdown, 800-1500 words, SEO-aware)
- Generate social posts (3-5 variants per request, platform-specific tone)
- Generate ad copy
- Generate email subject lines + body

System prompt:
"You are the Marketing employee at [account.name], a [account.business_type] business. You produce real content — not descriptions of content. When asked to write something, write the actual full content.

When you generate a blog post or any document longer than 200 words, format it as a saved artifact. End with this line on its own:
[ARTIFACT: blog_post | document | other]
[TITLE: <title>]
[CONTENT: <full content>]
[/ARTIFACT]

Style: Match the tone the business uses. For early-stage solo operators, write conversationally and with personality. For professional services (insurance, legal), write authoritatively and clearly.

You're not a chatbot. You're a marketing professional who ships."
```

### `lib/ai/employees/sales.ts`
```
Role: Sales / business development. Talks about prospecting, outreach strategy, sales calls.

TONIGHT: conversational only. Describes what would be done. Real execution (lead lists, automated outreach) ships in a future round.

System prompt:
"You are the Sales employee at [account.name], a [account.business_type] business. You're the prospector + closer combined.

Your style: scrappy, persuasive, results-oriented. You think in pipelines, conversion rates, and outcomes.

For now, when the user asks for something concrete (a lead list, automated outreach, a call campaign), tell them clearly: 'I'm sketching this out for you now. Real execution coming in the next update — for now I'll show you exactly what I'd do.' Then describe the strategy in detail.

NEVER make up fake leads or fake numbers. Be honest about what you can deliver vs what's coming."
```

### `lib/ai/employees/engineering.ts`
```
Role: Engineering department. Builds tools, websites, CRMs, automations.

TONIGHT: conversational only. Describes what would be built and how. Real execution (actual code/deploys) ships in a future round.

System prompt:
"You are the Engineering employee at [account.name], a [account.business_type] business.

When the user asks for something built (a website, a CRM, an integration), describe in detail:
- What you'd build
- How it would work
- What tech stack (in plain language, not jargon-heavy)
- How long it would take
- What the user would see when done

For now, end every concrete build request with: 'Real builds shipping in the next update — for now here's the full plan.'

You're a senior engineer who explains things clearly without condescension. NEVER show code unless explicitly asked. Talk in outcomes."
```

---

## TASK 4 — API routes

### `app/api/conduit/chat/route.ts` (POST, streams)

Input: `{ conversation_id?, message, employee_override? }`

Logic:
1. Authenticate user via Supabase session cookie. 401 if not authed.
2. Get or create user's `conduit_account` row. If no business_type yet, this triggers onboarding (TASK 5).
3. Get or create conversation. If `conversation_id` not provided, create new one and auto-title from the first message.
4. Insert user message into `conduit_messages`.
5. Determine which employee responds:
   - If `employee_override` provided, use that.
   - Else: route via Jarvis. Send the message + last 10 messages of context to Jarvis.
   - Jarvis responds. Stream to client.
   - Parse Jarvis's response for `[HANDOFF: <employee>]` and `[BRIEF: <brief>]`.
   - If handoff detected: insert Jarvis's response (without the routing tags), then immediately call the handed-off employee with the brief + user message + context. Stream that response too.
6. For each employee response, insert into `conduit_messages`.
7. Parse `[ARTIFACT: ...]` blocks from any message. Strip from displayed content. Insert into `conduit_artifacts` table.
8. Log token usage to `conduit_usage_events`.
9. Stream all output as SSE events:
   ```
   event: token
   data: {"employee": "jarvis", "delta": "Hello"}

   event: handoff
   data: {"to": "marketing", "brief": "..."}

   event: artifact
   data: {"id": "...", "type": "blog_post", "title": "..."}

   event: done
   data: {"conversation_id": "..."}
   ```

### `app/api/conduit/conversations/route.ts` (GET, POST)
- GET: list user's conversations, ordered by `updated_at DESC`
- POST: create blank conversation (rare; usually created by chat route)

### `app/api/conduit/conversations/[id]/route.ts` (GET, DELETE)
- GET: full conversation with messages
- DELETE: delete conversation

### `app/api/conduit/artifacts/route.ts` (GET)
- GET: list artifacts for current account, with filter by type

### `app/api/conduit/artifacts/[id]/route.ts` (GET, DELETE)
- GET: single artifact full content
- DELETE: delete artifact

---

## TASK 5 — Onboarding flow

When a user signs up and lands on `/app` for the first time (no `business_type` set on their account), show a 3-step onboarding modal:

1. **"What's your business called?"** → free text → `account.name`
2. **"What kind of business is it?"** → free text or chips of common ones (cleaning, real estate, insurance, restaurant, dental, med spa, e-commerce, agency, consulting, "other") → `account.business_type`
3. **"Tell Jarvis what you're working on or trying to build."** → textarea → `account.business_description`

On submit: save the three fields, dismiss modal, immediately initiate a welcome conversation. Jarvis sends the first message: "[user_name]! Welcome to Conduit. I just got read in on [account.name] — a [business_type] business. I see you're working on [business_description]. Where do you want to start?"

The welcome conversation is auto-created and shown in the chat UI.

---

## TASK 6 — UI

### `app/app/layout.tsx`
- Auth gate: redirect to `/auth/sign-in` if not authed
- Two-column layout:
  - Left rail (collapsible on mobile): conversation list, "New chat" button, settings link, sign out
  - Main column: chat window
- Dark theme by default, but READ from existing `conduit-nextjs` design system (don't fork — use what's there)
- Logo: "Conduit" wordmark top-left

### `app/app/page.tsx` (the chat itself)
- Streaming chat UI similar to Claude/ChatGPT
- Each message labeled with employee name + small avatar/initial badge:
  - Jarvis (J, dark slate)
  - Marketing (M, emerald)
  - Sales (S, amber)
  - Engineering (E, blue)
  - User (no label, right-aligned)
- When a handoff happens visually: a thin "→ Marketing taking this" inline transition card between Jarvis's message and Marketing's response
- Streaming text renders character-by-character (use `useChat`-style hook)
- Below input: small "Talking to: [employee dropdown]" — defaults to Jarvis (auto-route), but user can pin a specific employee
- Artifact preview: when an artifact is created mid-conversation, show an inline card "📄 Generated: [title] — Open" that opens a side drawer with the full content. (No emoji actually — use Lucide `FileText` icon. The 📄 above is shorthand.)
- Empty state for new chat: show 4 suggestion prompts:
  - "Help me grow my business" (routes to Jarvis → likely strategy convo)
  - "Write me 3 blog posts about [topic]" (Marketing)
  - "How would you build me a CRM for my business?" (Engineering)
  - "Draft me a cold outreach campaign" (Sales)

### `app/app/artifacts/page.tsx`
- Grid view of all artifacts for the user's account
- Filter by type
- Click → side drawer or modal with full content + copy/download buttons

### `app/app/settings/page.tsx`
- Tabs: Profile, Business, Usage, Billing (Billing = "Coming soon" stub)
- Profile: name, email
- Business: edit account.name, business_type, business_description (so user can refine after onboarding)
- Usage: total tokens used this month from `conduit_usage_events`, simple bar chart by day, by employee

### `app/auth/sign-in/page.tsx` and `/sign-up/page.tsx`
- Email + password forms
- Use Supabase Auth
- After sign-up: redirect to `/app` (which triggers onboarding modal)

---

## TASK 7 — Marketing site touchpoint

Don't redo the marketing site. But:
1. Add a top-right nav link: "Sign in" → `/auth/sign-in`
2. Update the hero CTA from whatever it currently says to: "**Talk to Conduit**" → links to `/auth/sign-up` (or `/app` if logged in)
3. Add ONE new section on the marketing homepage below the hero: a 3-line teaser:
   > **Conduit is the platform where you talk to AI and an AI team builds your business.**
   > Marketing, sales, engineering, ops. All in one chat. Watch them work.
   > [Sign up free →]

Keep all existing marketing content. This is additive, not a redesign.

---

## TASK 8 — Verification

For each component:
1. `npm run build` succeeds
2. Dev server returns 200 on `/app`, `/auth/sign-in`, `/auth/sign-up`, `/api/conduit/chat`
3. Manual end-to-end test (use Puppeteer if available, otherwise document for Luis):
   - Sign up with a test email
   - Complete onboarding
   - Send "Write me a blog post about why every cleaning business needs a website"
   - Verify Jarvis responds, hands off to Marketing, Marketing produces a real blog post artifact
   - Verify artifact persists in `conduit_artifacts` and shows up in artifacts page
   - Verify token usage logged to `conduit_usage_events`
4. Check Supabase advisors (security + performance) after migrations

---

## TASK 9 — Ship

- Open PR `feat/conduit-chat-shell-v1 → main`
- Title: `Conduit v1: chat platform shell with Jarvis routing + Marketing execution`
- Body: list every task completed, deviations, what's deferred to Round 2
- Append to a new file `CONDUIT_LOG.md` at repo root with a "Round 1" section
- **Merge to main when verification passes** (cleanup-grade risk; one user, one feature, well-scoped)
- Vercel auto-deploys to conduitai.io
- Verify production:
  - `https://conduitai.io/` (marketing) returns 200
  - `https://conduitai.io/app` (auth-gated) redirects to sign-in
  - Sign-up flow works in production
  - Chat works in production with a real test message

---

## Status report format

When done, output:
1. Schema: which migrations applied, advisor findings
2. Model abstraction layer: file path, providers wired
3. Employees: which of the 4 are live, which are conversational vs executing
4. API routes: list endpoints + auth status
5. UI: which pages exist, screenshots if Puppeteer available
6. Marketing site changes: confirm hero updated, nav link added
7. End-to-end test results
8. Production health checks
9. Anything Luis should look at first when he logs in
10. What's queued for Round 2

---

## What Round 2 covers (do NOT ship tonight, just queue)

- Voice mode (Jarvis + employees can be talked to via mic; ElevenLabs or browser SpeechRecognition for STT, ElevenLabs for TTS)
- Phone number (Twilio number per account; Jarvis can call user, user can call Jarvis)
- Real execution for Engineering (actually builds CRMs/sites via Claude Code subprocess or similar)
- Real execution for Sales (lead list generation, automated outreach)
- Stripe billing (subscription + token credits)
- Mobile app (Expo, reuse the API)
- Multi-user accounts (invite teammates to your Conduit)

---

## Hygiene

- ANTHROPIC_API_KEY unset in dev shell (Max plan)
- Don't fabricate credentials
- Don't expose provider names anywhere user-facing
- Don't ship 32 employees tonight — ship 4 well, queue the rest
- Don't redo marketing site — additive only
- Multi-tenant: every query scoped by `account_id`
- Conduit users never see "Claude," "Anthropic," "GPT," etc.
- This round goes to production. Treat it as production-grade.
