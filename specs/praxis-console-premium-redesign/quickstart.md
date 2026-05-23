# Quickstart — Praxis Console Premium Redesign

How a developer or designer running this repo locally can exercise
every story and acceptance scenario in the spec, on the Vercel
preview deploy and locally.

---

## 0. Prerequisites

```bash
git pull
npm install                  # node_modules — needed for Next.js doc citations per R-011
cp .env.example .env.local   # if not already present
# Fill .env.local with Supabase + LiveKit + Anthropic credentials
```

Per Constitution Principle V, the canonical verification surface is
the **Vercel preview deploy**, not local. Use local for the build /
typecheck loop; verify visual behavior on preview.

---

## 1. Local dev loop

```bash
npm run dev          # http://localhost:3000
```

Sign in to a test account at `http://localhost:3000/auth/sign-in`.
Use an internal account (`internal_account = true`) to see all 9
employees unlocked; use a free account to see the tier-locked
ghosted variant behavior.

---

## 2. Story 1 — Dashboard verification

Navigate to `/app/workspace`.

**Verify (Story 1 AC-1)**:
- Headline names the operator AND the most recent dept-driven event:
  e.g. "Welcome back, {firstName}. Marketing finished the 3-post draft."
- Canvas carries a subtle tint keyed to the most-recently-active
  employee. Reload to confirm the tint flips when activity history
  changes.
- "Your team" row's status pips show ambient pulses for any
  department with activity in the last 24h.

**Verify (Story 1 AC-2)** — empty account:
- Sign in to a fresh test account.
- Headline degrades to "Welcome, {firstName}. Your team is on
  standby."
- KPI tiles surface invitations ("Tell Atlas about your business"),
  not zeros.
- Team grid pulses in slow synchronised idle rhythm.

**Verify (Story 1 AC-3)** — live voice session:
- Start a voice session (`/app/voice`, join a room with any employee).
- Switch to `/app/workspace`.
- Confirm `PraxisLiveStrip` appears above the hero with "Rejoin"
  affordance and waveform pulse.
- Dashboard body mutes by ~15% opacity (per Edge Cases).

**Verify (Story 1 AC-4)** — hover tint:
- Hover any team card. Confirm canvas tint shifts to that dept's wash
  over ~240ms. Un-hover; confirm release over ~480ms (slower exit).

**Verify (Story 1 AC-5)** — tabular figures:
- KPI tile metrics use monospace tabular figures (no digit reflow).
- Time-since stamps cross-fade on tick (200ms).

---

## 3. Story 2 — Team grid verification

Still on `/app/workspace`.

**Verify (Story 2 AC-1)** — hot lead:
- Insert a new sales lead with `score >= 80` into `sales_leads` via
  SQL or the Sales workspace itself.
- Within ≤60s (per R-002 polling cadence), Sales card shows a
  pulsing emerald notification dot distinct from the always-on
  ambient pulse.
- Hover preview shows "Just scored: {business_name} · {score}/100".

**Verify (Story 2 AC-2)** — Engineering in-flight:
- Trigger an engineering build (Engineering team page → "Start
  build" CTA → enter prompt).
- Return to `/app/workspace`. Engineering card shows in-flight
  treatment: faster pulse, scanning-line, "1 build in flight"
  sub-label.

**Verify (Story 2 AC-3)** — locked dept:
- Sign in as a free-tier account.
- Compliance / Legal / etc. render as ghosted variants with the lock
  glyph; hover copy: "Hire Compliance — $X/mo" (or upgrade-tier
  equivalent that the existing tier system surfaces).

**Verify (Story 2 AC-4)** — page-transition continuity:
- Click any team card. Confirm the destination
  `/app/team/[employee]` header band picks up the source card's tint
  within 360ms (visible color continuity, not a flash-of-white-then-
  fill).

**Verify (Story 2 AC-5)** — mobile 375px:
- Open `http://localhost:3000/app/workspace` in a 375×667 viewport.
- Team grid collapses to 2 columns.
- All cards have ≥44px hit areas.
- Pulse rhythm slows by 20% (per FR-054).
- Order: Atlas first, then most-engaged dept, then roster order.

---

## 4. Story 3 — Chat shell verification

Navigate to `/app` (a fresh conversation, no `?c=` query).

**Verify (Story 3 AC-1)** — empty state:
- Hero reads "Atlas is at the table." (or time-of-day variant).
- Atlas avatar at 28–32px adjacent to the headline.
- Four suggestion tiles, each attributed to a department by avatar +
  dept name + prompt.

**Verify (Story 3 AC-2)** — streaming wash:
- Send a message that routes to Marketing (e.g. "Draft a blog post").
- While streaming, canvas backdrop carries a 4–6% Marketing wash.
- Stream completes; wash fades to 0% over ~600ms.

**Verify (Story 3 AC-3)** — handoff baton:
- Send a message that triggers Atlas → Engineering handoff (e.g.
  "Build me a CRM").
- Confirm handoff card animates left-edge color from platinum
  (Atlas) → electric blue (Engineering) over ~480ms.

**Verify (Story 3 AC-4)** — pinned employee:
- Pin Sales via the composer dropdown.
- Confirm canvas carries a persistent 8–10% Sales wash until
  unpinned.

**Verify (Story 3 AC-5)** — TTS sync:
- On a tier with TTS allowed (paid or internal), click replay on an
  assistant message.
- Confirm that message's avatar pulses in sync with audio
  amplitude (or smoothed proxy).
- "Stop voice" floating button is dept-colored, not generic accent.

---

## 5. Story 4 — Design system verification

**Grep for arbitrary utilities** on redesigned surfaces:

```bash
# From repo root, on a branch with the redesign merged locally
for f in \
  src/app/app/workspace/page.tsx \
  src/app/app/team/\[employee\]/page.tsx \
  src/components/conduit/Chat.tsx \
  src/components/conduit/praxis/*.tsx
do
  grep -nE 'text-\[[0-9]+(px|rem)\]|min-h-\[[0-9]+px\]|px-\[[0-9]+(px|rem)\]|#[0-9A-Fa-f]{3,8}\b' "$f" || echo "OK: $f"
done
```

Expected: every line prints `OK:` (zero hits).

**Theme switch test**:
- In dev console, run
  `document.documentElement.setAttribute('data-praxis-theme', 'light')`.
- Reload (theme is applied at boot).
- Dashboard / team grid / chat empty state all render correctly in
  light theme with no per-component overrides needed.
- Switch back: same.

**Token reference**:
- Open `docs/praxis-design-system.md` (created during implementation).
- Confirm every token from `contracts/tokens.md` is documented with
  example values in both themes.

---

## 6. Story 5 — Motion verification

**Watch 30 seconds of the team grid with no interaction**:
- Confirm at least 3 distinct ambient micro-motions visible:
  - Per-dept ambient pulse (varying cadences per FR-054)
  - Hovered/active dept's tint drift
  - Periodic "someone said something" subtle flash on a randomly-
    chosen active dept

**Trigger ship celebration**:
- While on `/app/workspace`, run a successful engineering build that
  transitions `conduit_builds.status` to `live`.
- Within ≤60s (polling cadence), Engineering card fires a one-shot
  flash + pip travel along canvas top edge over ~1.2s.
- Reload the page after the celebration completes: the celebration
  must NOT re-fire (per R-008 "no faking retroactive aliveness").

**Reduced-motion**:
- macOS: System Settings → Accessibility → Display → Reduce motion.
- Linux/X11: `gsettings set org.gnome.desktop.interface
  enable-animations false`.
- Reload `/app/workspace`.
- Confirm: no pulses, no breathing, no tint transitions, no baton
  animation. The thesis must still land via texture + color + type.

---

## 7. Constitutional verification (Principle V)

Before the PR merges:

- [ ] Vercel preview URL exercises all three surfaces in browser
- [ ] 375px viewport sweep: dashboard, team grid, chat empty,
      team-page header, all readable, no horizontal scroll
- [ ] 390px viewport sweep: same
- [ ] Light theme sweep: same at desktop + 375px + 390px
- [ ] Reduced-motion sweep at all viewports
- [ ] Grep verification per §5 above shows zero hits
- [ ] `docs/praxis-design-system.md` exists and is current
- [ ] `SESSION_REPORT_2026-05-XX_PRAXIS_CONSOLE_R15_PREMIUM.md`
      drafted, capturing decisions + verification outcomes + follow-ups
- [ ] Provider-name blocklist grep on redesigned files: zero hits for
      `Claude`, `Anthropic`, `OpenAI`, `Sonnet`, `Opus`, `Haiku`,
      `ElevenLabs` (Principle III)
- [ ] No imports from `src/components/Hero.tsx`, `Footer.tsx`,
      `Navbar.tsx`, or any other marketing component in any redesigned
      file (Principle IV)

---

## 8. Performance sanity

```bash
npm run build    # confirm production build succeeds
```

In dev, with the dashboard open and idle:
- Open DevTools Performance, record 10s.
- Confirm no per-frame layout/paint thrashing.
- Confirm CPU profile shows no JavaScript driving the ambient pulses
  (pure CSS keyframes only — Assumption 7 / FR-058).
- Confirm no `requestAnimationFrame` loop is running for the canvas
  tint (CSS `transition` only — R-005).

---

## 9. When to STOP and validate

Per spec-toolkit workflow, after each user-story phase implementation:

- **After P1 stories ship** (Story 1 + Story 2 tied) — stop, exercise
  the dashboard cold and report findings. Do not start Story 3 until
  the user has validated the dashboard.
- **After Story 3 ships** — stop, exercise chat cold (empty state +
  streaming + handoff + pinned) and validate.
- **After Story 4 ships** — stop, run the grep verification, confirm
  zero violations.
- **After Story 5 ships** — stop, run the motion + reduced-motion
  verification, confirm both states hold.

Each stop is an opportunity for the user to redirect.
