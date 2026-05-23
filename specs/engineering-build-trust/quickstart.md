# Phase 1 Quickstart — Engineering Build Trust

**Feature**: engineering-build-trust
**Date**: 2026-05-23
**Status**: Phase 1 complete — verification recipes for each user story

This document is the **verification gate** for each Phase A/B/C merge. It is
the sweep the implementer MUST walk through on the Vercel preview deploy
before merging to `main`. Constitution Principle V ("Verification by Preview
+ Mobile Sweep") is enforced by these recipes.

---

## §0. Preflight

Before walking any per-story recipe:

- Confirm the preview deploy is live (Vercel auto-deploys the branch).
- Confirm `ENGINEERING_WORKER_URL` and `ENGINEERING_WORKER_SECRET` are set on
  the preview environment (Vercel Settings → Environment Variables → Preview
  scope). If the env var is unset, the recipes covering "fresh build" cannot
  proceed; switch to **§7 Failure-mode recipes** to verify the
  worker_url_missing path.
- Sign into the preview as the `internal_account = true` operator (Luis's
  account).
- Open DevTools → Network tab, throttling = "No throttling" by default. Some
  recipes will switch this on.

---

## §1. P1 US1 — A build in flight is never silently lost

### §1.1 Durable URL survives refresh, navigation, tab close

1. From `/app/team/engineering`, click **Start a build**.
2. Type prompt: "Build me a one-page landing for a fictional coffee shop in Austin." Build type: `landing-page`.
3. Submit. Confirm the browser navigates to `/app/builds/<some-uuid>` (URL bar visible).
4. While the build is running:
   - Refresh the page (Cmd-R). Cinema re-renders fully populated. No flash of empty state. ✓
   - Navigate to `/app/workspace`. Confirm the in-flight strip is at the top (§3 recipe). ✓
   - Navigate to `/app/team/sales`. Confirm the sidebar pulse pip is visible on the Builds entry. ✓
   - Use the browser's back button. Confirm /app/workspace re-renders with the strip still live. ✓
   - Close the tab. Reopen `/app/builds/<that-uuid>`. Cinema re-mounts populated. ✓
5. Confirm the URL is exactly `/app/builds/<uuid>` — not `/app/builds?session=<uuid>`.

### §1.2 Backward-compatible legacy URL

1. While the same build is running, manually visit `/app/builds?session=<uuid>`.
2. Confirm a server-side redirect happens to `/app/builds/<uuid>`.

### §1.3 Realtime drop awareness (FR-008, FR-009)

1. With a build in progress, open DevTools → Network → set throttling to **Offline**.
2. Within 2 seconds, the cinema header shows a "reconnecting…" pip (small dept-tinted dot + text). ✓
3. Set throttling back to "No throttling". Within 8 seconds, the pip clears and any logs emitted during the offline window appear in the raw-log panel (no duplicates — same `id` not appearing twice). ✓

### §1.4 Stuck detection (FR-010, FR-011)

1. Find a stalled or genuinely slow phase of a real build (or, in dev, force a 90s+ gap by killing the realtime subscription via DevTools).
2. After ~90s of no events, the stage band cross-fades to `INVESTIGATING · STILL THINKING` with a "Refresh now" button. ✓
3. Click "Refresh now". Server re-fetches. Either:
   - New logs arrive → state clears, heartbeat resets to healthy.
   - No new logs → eyebrow stays "STILL THINKING" but the elapsed clock continues monotonically.

### §1.5 Error boundary (FR-012)

Dev-only test (skip in prod preview unless you can inject):

1. Temporarily add `throw new Error('cinema-test')` into `BuildCraftStrip` on mount.
2. Open a cinema page. The error boundary mounts: "Something in the live view broke — your build is still running." + "Reopen" button. ✓
3. Click "Reopen". The cinema re-mounts (via `unstable_retry()`) and renders cleanly. ✓
4. Revert the test injection before commit.

### §1.6 Non-owner 404

1. Sign out and into a different account (or use an incognito session signed in as a different user).
2. Visit `/app/builds/<a-uuid-from-the-original-account>`.
3. Confirm a clean 404 — no leaked session prompt, no flash of partial UI.

---

## §2. P1 US2 — Honest live progress, not a terminal dump

### §2.1 Stage band dominance

1. Open a cinema page for a running build.
2. The dominant visual element above the fold is the step indicator (serif display, large), NOT the raw terminal log. ✓
3. Eyebrow text names the operation in plain English (e.g. "BUILDING THE PROJECT" while WRITE logs are flowing). ✓
4. The raw terminal log is in a collapsed disclosure ("Show technical log") at the bottom of the cinema. ✓

### §2.2 Craft strip animation

1. While the build is writing files, watch the craft strip in the middle of the cinema.
2. Newly-emitted `WRITE <path>` and `EDIT <path>` chips enter with a scale-up animation (180 ms). ✓
3. A spark bar sweeps left-to-right across the strip (280 ms) on each new file event. ✓
4. The most-recent chip pulses subtly (opacity 0.6 → 1, 600 ms infinite). ✓
5. Open `chrome://flags` → enable "Force reduced motion". Reload. Confirm:
   - Spark bar does NOT appear.
   - Most-recent chip pulse is static.
   - Chip enter animation is instant.
   - All other ambient motion is omitted or opacity-only.

### §2.3 Elapsed + spend tally

1. Stage band's right side renders elapsed (mm:ss, monotonically incrementing every second).
2. Running input tokens, output tokens, and USD spend estimate visible.
3. Stop watching for 30 seconds. The values continue to update without flicker on realtime events.
4. On terminal status (`complete` / `failed` / etc.), the elapsed freezes.

### §2.4 Preview iframe materialization (FR-006, FR-007)

1. Watch the cinema until the build's session row sets `deploy_url`.
2. The preview stage transitions: placeholder copy fades out (240 ms); iframe loads + curtain-rise reveal (480 ms clip-path animation) materializes the iframe.
3. The iframe renders the live preview (the deployed site).
4. On reduced-motion: same outcome but the curtain rise is a 120 ms opacity fade instead.

### §2.5 Iframe fallback (X-Frame-Options blocked)

1. (Test condition: a build whose deploy_url responds with `X-Frame-Options: DENY` or restrictive CSP `frame-ancestors`. May need to fabricate by deploying a site that sets these.)
2. After the 3s load timeout, the iframe is replaced with a placeholder card: the URL displayed prominently + "Open in new tab" affordance.
3. The rest of the cinema (stage band, craft strip, logs) is unaffected.

### §2.6 Shipped summary

1. On `status = complete`, the cinema transitions from the in-progress treatment to a shipped summary in the same beat as the preview iframe materializing.
2. Summary renders: deploy URL, GitHub repo link, total files-touched count, total elapsed, total tokens (in + out), final USD spend.
3. A "Continue from this build" affordance is visible.

### §2.7 Mobile reflow (FR-027)

1. Open the cinema on a 375 px viewport (DevTools device emulation: iPhone SE).
2. Stage band stacks: step label on top, elapsed + spend below.
3. Craft strip scrolls horizontally (native scroll-snap) without page overflow.
4. Preview stage fills below; iframe responsive.
5. Header collapses prompt to one line with ellipsis.
6. Abort + close buttons are ≥ 44 px tap targets (measure via DevTools).
7. Repeat at 390 px (iPhone 14). Confirm same.

### §2.8 Light theme parity

1. Settings → Theme → Light. Confirm all cinema surfaces remain legible.
2. Engineering dept tint reads correctly on the light canvas.
3. Iframe + raw-log panel both readable in light mode.

---

## §3. P1 US3 — Dashboard ambient watching

### §3.1 In-flight strip presence

1. Start a build.
2. Navigate to `/app/workspace`.
3. The in-flight strip is at the top of the dashboard, above `PraxisWelcomeHero`. ✓
4. Eyebrow text: `BUILDING · <step.eyebrow>`. Live-updates as worker emits.
5. Inline secondary: `<elapsed> · <fileCount> files`. Updates every second / per realtime event.
6. Click the strip. The cinema opens at `/app/builds/<id>`. ✓
7. Hit browser back. /app/workspace renders with the strip still live and current.

### §3.2 Strip disappears post-terminal (FR-016)

1. Wait for the build to reach `complete`.
2. The strip transitions to `JUST SHIPPED · <prompt summary>` for 5 seconds.
3. After 5 seconds, the strip unmounts. Dashboard reflows.

### §3.3 Failure interstitial

1. Force a build to fail (try an obviously-broken prompt, or simulate failure via DB UPDATE in dev).
2. The strip transitions to `BUILD FAILED · <translated headline>` with a pink stripe instead of dept tint.
3. After 5 seconds, the strip unmounts.

### §3.4 Multi-build (FR-014)

1. Start two builds back-to-back (within 5 seconds).
2. The strip shows the most-recently-started one with a "+1 more" affordance.
3. Click "+1 more" → routes to `/app/builds` index (shows both rows).

### §3.5 No-build state (zero layout shift)

1. With no in-flight builds, /app/workspace renders without the strip.
2. The position the strip would occupy is collapsed (no empty placeholder). ✓

### §3.6 Sidebar pulse pip

1. With a build in flight, the Sidebar's `/app/builds` entry shows a small dept-tinted dot at the icon's top-right corner.
2. When the build reaches terminal status, the pip clears within 5 seconds.

### §3.7 Engineering team card affordance (FR-013)

1. /app/workspace team roster → Engineering card.
2. The bottom-line copy reads "Building now →" (replaced from "1 build in flight").
3. Clicking the copy routes to the cinema (not to /app/team/engineering — `ClickInterceptor` works).
4. Clicking elsewhere on the card routes to /app/team/engineering (parent link preserved).

---

## §4. P2 verification

(Phase B merge gate.)

### §4.1 Failure-dignity translation (FR-020–FR-024)

For each of the matcher classes M2–M10 (per `contracts/error-translation.md`):

1. Inject (or find a historical row with) an `error_message` matching the class.
2. Open `/app/builds/<id>`. Confirm:
   - Headline matches the contract (no `worker_start_*` prefix visible).
   - Body is plain English.
   - Recovery affordance matches kind (retry / continue-from / contact-support / edit-env).
   - `[Show details]` disclosure reveals the original raw error.
3. Confirm operator vs. non-operator gating: M2 with `internalAccount=true` shows env-edit hint; with `false` shows the dignity-preserving fallback.

### §4.2 Historical retro-translation

1. Visit `/app/builds`. Enable "Show failed".
2. The legacy `worker_start_Failed to parse URL...` rows now show "Earlier build couldn't reach the build service" instead.
3. Confirm the DB `error_message` column still contains the original verbatim.

### §4.3 Share-URL affordance

1. In the cinema header, click the "Copy URL" button.
2. The clipboard contains `https://<preview-host>/app/builds/<id>`.
3. A confirmation toast renders briefly.

---

## §5. P3 verification

(Phase C merge gate.)

### §5.1 Chat-pulse synchronization

1. With a build in flight, open `/app`.
2. Engineering's avatar in the chat right-rail shows a "building" pulse cadence distinct from the idle ambient cadence.
3. When the build flips to `complete`, the avatar shows a one-time celebration (≤ 2s).

### §5.2 Pre-commit cost estimate

1. Open the build modal (Engineering team page → "Start a build").
2. Type a prompt ≥ 8 chars.
3. An estimated cost range appears (e.g. "≈ $0.30–$0.90").
4. Submit. Watch the cinema; verify the final actual spend in the shipped summary is within ±50% of the estimate.

---

## §6. Constitution Principle V — cross-cutting sweep

Run this matrix at every phase merge gate:

| Dimension | Pass criterion |
|---|---|
| Vercel preview URL | Loads cinema, dashboard, builds index, sidebar, team-card all without console errors |
| 375 px viewport | All §1–§3 recipes pass; tap targets ≥ 44 px; no horizontal scroll |
| 390 px viewport | Same |
| Light theme | All surfaces legible; dept tint reads on light canvas |
| Dark theme | All surfaces legible (the default) |
| Reduced-motion preference active | All ambient motion off or opacity-only; recipes §2.2, §3.1, §2.4 verify |
| No provider strings | grep `(claude|anthropic|openai|sonnet|opus|haiku|gpt|elevenlabs|livekit)` across `/app/app/builds/`, `/components/conduit/builds/`, `/hooks/`, `/lib/engineering/`, `/styles/engineering-cinema.css` — zero hits in new code (FR-030 / Constitution III) |
| No marketing imports | grep `from "@/components/(Hero|Footer|Navbar|Cinematic|Customers|EngineeringProof|FinalCTA|Pricing|ProductTiles|Vision|WaitlistForm)"` across this feature's new files — zero hits (Constitution IV) |
| `src/proxy.ts` untouched | `git diff --stat src/proxy.ts` returns 0 lines (Constitution I) |
| Zero new migrations | `git diff --stat supabase/migrations/` returns 0 changed files (Constitution II) |
| Zero new npm deps | `git diff --stat package.json package-lock.json` returns 0 changes (Spec Assumption 5) |

---

## §7. Failure-mode recipes

For when the happy path doesn't apply (env unset, worker down, etc.).

### §7.1 `worker_url_missing`

1. On Vercel, temporarily unset `ENGINEERING_WORKER_URL` in the preview env.
2. Trigger a build.
3. The POST returns 502; the cinema (or the build modal error display) shows the operator-tier translated message: "The build service isn't connected yet" + "Open Vercel project settings" affordance.
4. Restore the env var; redeploy preview; verify fresh builds succeed.

### §7.2 Worker 5xx

1. Stop the Railway worker (or block the URL via networking).
2. Trigger a build.
3. Within ~10s (the fetch timeout), the cinema shows the translated network-error message.
4. Restore the worker.

### §7.3 Mid-build abort

1. Start a long build.
2. Click "Stop build" in the cinema header.
3. Confirm `aborted` status flows through realtime; the shipped summary renders the "You stopped this build" translated message.

---

## §8. Session report

After Phase A merge gate passes:

- Create `SESSION_REPORT_2026-05-XX_ENGINEERING_BUILD_TRUST.md` at repo root.
- Document: which recipes passed, which failed and were fixed, any step-taxonomy refinements made during A2 verification, any P2/P3 carve-outs.
- Commit alongside the Phase A merge.

After Phase B and Phase C, append sections to the same report rather than
creating new ones — keeps the round-of-work cohesive (one milestone =
one report per Constitution Principle V's pattern).
