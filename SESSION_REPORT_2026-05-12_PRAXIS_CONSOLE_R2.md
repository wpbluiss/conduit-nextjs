# Praxis Console — Web R2: R1 live-verification fixes

**Date:** 2026-05-12
**Branch:** main (in progress)
**Scope:** Four bounded fixes confirmed from R1 live verification at
conduitai.io/app. Each shipped with its own verification gate.

---

## TL;DR

R1 shipped visual + IA parity. Walking the live Console surfaced four
real-world inconsistencies; this round resolves them.

| # | Fix | Cause | Resolution |
|---|---|---|---|
| 1 | Voice Room copy contradiction | `/app/voice` was live (token + LiveKit + EnterTheRoomCard wired); `/app/settings → Voice` still showed "Coming in a future update." | Deleted the stale `VoiceRoomCard` from `SettingsTabs.tsx`. |
| 2 | Voice settings parity 4 → 9 | `VOICE_EMPLOYEES` array in `SettingsTabs.tsx` only listed Atlas/Marketing/Sales/Engineering. | Added Finance, Compliance, HR, Operations, Legal with their existing ElevenLabs voice IDs (already in `DEFAULT_EMPLOYEE_VOICES`). Updated API allowlist in `/api/conduit/voice/prefs` so writes for the new 5 actually persist. |
| 3 | Logo swap (prism → curved P) | Mobile R20 carries the ChatGPT-rendered curved P; Console still showed the geometric prism. | Rewrote `PraxisLogo.tsx` as a single brand-purple curved-P glyph (SVG path with evenodd bowl cutout, rounded stem corners). Same Props shape — Sidebar + OnboardingModal pick it up automatically. Real exported asset will replace this in a follow-up ticket. |
| 4 | Builds page failures | `ENGINEERING_WORKER_URL` / `MARKETING_WORKER_URL` set on Vercel as host-only (no `https://`), so Node's `fetch()` rejected with `TypeError: Failed to parse URL`. | Added `resolveWorkerBase()` in both `src/lib/engineering/worker.ts` and `src/lib/marketing/worker.ts` to defensively prepend `https://` when the scheme is missing. Strips trailing slash. |

---

## Item 1 — Voice Room contradiction

**Audit:** `/app/voice` mounts `EnterTheRoomCard`, which calls
`POST /api/voice/token` (LiveKit `AccessToken` issuance, roundtable
participant validation, tier gating), then renders the multi-avatar
`VoiceRoom` overlay. The worker accepts the token, joins the room, runs
TTS through ElevenLabs. R1 verified this works end-to-end in production.

The `VoiceRoomCard` inside `SettingsTabs.tsx` was a leftover from when
Voice Room was unreleased — its "Notify me when it's ready" button writes
`notify_voice_room_ready=true` to `conduit_accounts`, which has no
downstream consumer now that the feature is shipped.

**Decision:** Voice Room IS live → delete the stale settings card.

**Files:**
- `src/components/conduit/SettingsTabs.tsx` — removed `<VoiceRoomCard />`
  reference + the entire component definition. Kept `notify_voice_room_ready`
  column untouched (no schema change; the column is now historical).

---

## Item 2 — Voice settings parity (4 → 9)

**Audit:**
- `src/lib/voice/defaults.ts` already has ElevenLabs voice IDs for all
  9 employees (Dave/Grace/Lily/Charlie/Daniel for the missing 5).
- `EmployeeKey` type in `src/lib/ai/provider.ts` already enumerates all 9.
- `DEPT_COLOR` in `EmployeeBadge.tsx` covers all 9 via the central
  `EMPLOYEES` map.
- `/api/conduit/voice/preview` accepts any employee key as input — no
  changes needed there.

Only the UI list and the persistence allowlist were stuck at 4.

**Files:**
- `src/components/conduit/SettingsTabs.tsx` — `VOICE_EMPLOYEES` now
  enumerates all 9 in canonical order (matches `EMPLOYEE_ORDER` from
  `src/lib/conduit/employees.ts`).
- `src/app/api/conduit/voice/prefs/route.ts` — `VALID_EMPLOYEES` now lists
  all 9 so `POST` actually upserts rows for Finance/Compliance/HR/Ops/Legal
  into `conduit_employee_voices`.

Voice IDs (unchanged, already in `DEFAULT_EMPLOYEE_VOICES`):
- Finance: `CYw3kZ02Hs0563khs1Fj` (Dave)
- Compliance: `oWAxZDx7w5VEj9dCyTzz` (Grace)
- HR: `pFZP5JQG7iQjIQuC4Bku` (Lily)
- Operations (`ops`): `IKne3meq5aSn9XLyUdCD` (Charlie)
- Legal: `onwK4e9ZLuTAKqWW03F9` (Daniel)

---

## Item 3 — Logo swap (prism → curved P)

**Audit:** No "curved P" asset exists in `public/` or anywhere in the repo.
Mobile R20's exported asset is in the sibling Praxis Mobile project and
hasn't been mirrored.

**Decision (confirmed with user):** generate an SVG approximation now,
swap to the real ChatGPT-rendered asset in a follow-up ticket once Luis
re-exports.

**Design:**
- Single `<path>` with `fill-rule="evenodd"` for the bowl cutout
- Outer outline: stem with subtle rounded corners (radius 0.5 in
  24-unit viewBox), bowl arc (radius 5.5) bulging right
- Inner cutout: D-shape arc (radius 2.5) anchored to the stem's
  right edge
- Single fill: `var(--color-praxis-purple)` (oklch(50% 0.22 290))
- ViewBox 0 0 24 24, renders crisp 14px–96px
- Glow filter (`.praxis-mark`) preserved for the rail usage

**Files:**
- `src/components/conduit/PraxisLogo.tsx` — full rewrite of the SVG body.
  Props shape unchanged (`size`, `withWordmark`, `className`, `glow`), so
  callers in `Sidebar.tsx` (rail header) and `OnboardingModal.tsx` (step
  indicator) pick up the new glyph with zero edits.

---

## Item 4 — Builds page failures

**Diagnosis:** The R1 verification screenshot showed 4 of 5 sessions
failing with `worker_start_Failed to parse URL from
conduit-engineering-worker-production.up.railway.app/session`.

That error string traces back to `src/app/api/engineering/session/route.ts:135`:

```ts
error_message: `worker_start_${start.error ?? start.status}`,
```

…where `start.error` came from `startWorkerSession`. Inside that helper:

```ts
const url = process.env.ENGINEERING_WORKER_URL;
// …
const r = await fetch(`${url.replace(/\/$/, "")}/session`, { … });
```

Node's `fetch()` throws `TypeError: Failed to parse URL from <host>/path`
when the input is host-only (missing `http://` or `https://`). Railway's
dashboard displays domains host-only, so an operator who copies the
domain into Vercel's env var UI without prepending `https://` ends up
with a value like `conduit-engineering-worker-production.up.railway.app`,
which fails at every build.

**Choice between root-cause fix vs. UI hiding:** The fix is trivial —
one helper function, four call sites. UI hiding would mask future
misconfigurations of the same kind. Picked the fix.

**Files:**
- `src/lib/engineering/worker.ts` — added `resolveWorkerBase()` that
  reads `ENGINEERING_WORKER_URL`, prepends `https://` if no scheme
  present, and strips a trailing slash. Used by both
  `startWorkerSession` and `abortWorkerSession`.
- `src/lib/marketing/worker.ts` — mirrored the same helper for
  `MARKETING_WORKER_URL` (same Railway-host-only failure mode would hit
  marketing sessions identically).

**Note on stale failed rows:** Existing failed sessions in
`conduit_engineering_sessions` and `conduit_marketing_sessions` remain
visible in `/app/builds` — they're historical, not regressions. The user
can manually clear them later or accept them as a one-time backlog. No
schema change made here.

---

## Files changed

```
src/components/conduit/SettingsTabs.tsx       voice parity (9 selectors), removed VoiceRoomCard
src/app/api/conduit/voice/prefs/route.ts      VALID_EMPLOYEES → 9
src/components/conduit/PraxisLogo.tsx         curved-P glyph (single path, evenodd cutout)
src/lib/engineering/worker.ts                 resolveWorkerBase() — prepend https:// if missing
src/lib/marketing/worker.ts                   same helper, MARKETING_WORKER_URL
SESSION_REPORT_2026-05-12_PRAXIS_CONSOLE_R2.md  this file
```

## Build / deploy

- `npx tsc --noEmit` — clean.
- `npm run build` — clean, all routes generate.
- Push to `main` triggers Vercel auto-deploy → conduitai.io/app.

## Verification deferred to live deploy

- `/app/settings → Voice`: confirm all 9 selectors render with play
  buttons (Item 2) and the "Coming soon" Voice Room card is gone (Item 1).
- Rail header + onboarding chip: confirm the curved-P glyph reads
  cleanly at 20px (rail) and 14px (onboarding) (Item 3).
- `/app/builds`: confirm new builds succeed without `Failed to parse URL`
  (Item 4) — requires Vercel env var to be set correctly. If
  `ENGINEERING_WORKER_URL` was previously set to a host-only string, the
  fix self-heals. If it was unset, that's a separate config issue surfaced
  as `worker_url_missing` (clearer error path).

## Follow-ups

- Swap PraxisLogo's SVG approximation for the real ChatGPT-rendered
  curved-P asset once Luis re-exports it.
- Decide whether to bulk-mark or hide the existing failed builds rows
  predating today.
- The `notify_voice_room_ready` column in `conduit_accounts` is now
  historical; consider a one-line migration to drop it later.
