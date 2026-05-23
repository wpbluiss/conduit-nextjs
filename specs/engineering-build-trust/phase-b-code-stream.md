# Phase B — Live Code-Stream Panel

**Date**: 2026-05-23
**Status**: DIAGNOSIS COMPLETE — approach locked, design + build NOT started.
**Trigger**: Luis ran the Lunaro build (b81aea12, 2026-05-23). Cinema worked.
Gap surfaced: the craft strip shows file paths but not the code being written.
User wants "watch a craftsman work" — actual syntax-highlighted lines streaming
into the cinema as Engineering writes each file.

---

## Diagnosis

Source: direct query against `conduit_engineering_logs` for the Lunaro build
session `b81aea12-418d-493f-9f55-cb71be4aa7d5`. 37 log rows total. Full
emission timeline:

```
T+0s    system   "session accepted by worker"
T+0s    system   "workspace: /workspace/b81aea12-…"
T+0s    system   "build_type: landing-page"
T+2s    system   "claude_session_init"
T+24s   system   "WRITE /workspace/…/index.html"
T+67s   system   "WRITE /workspace/…/style.css"
T+73s   system   "WRITE /workspace/…/script.js"
T+81s   stdout   <902-char Claude English summary>
T+81s   system   "claude_result: success"
T+82s   system   "running vercel deploy --prod"
T+82-88s stderr  [vercel] CLI output (25 lines)
T+94s   system   "deploy_url: …"
T+94s   system   "session complete"
```

**Finding**: The realtime stream emits file **NAMES**, not **CONTENT**.
- Each `WRITE <path>` system log fires AFTER the file is fully on disk.
- The `message` column carries the path only — no content, no chunk, no delta.
- Claude's per-token generation stream is NOT captured. The worker runs
  Claude as a CLI subprocess; its streaming stdout is consumed internally
  but not forwarded to `conduit_engineering_logs`.
- The single 902-char stdout row is Claude's final English summary, emitted
  AFTER all writes are done. It's prose, not code.

**Net**: today, the cinema's craft strip cannot show code content because
no code content is in the realtime channel.

---

## Approach (locked by Luis, 2026-05-23)

**Path C — worker streams Claude tokens per chunk.** The engineering-worker
repo captures Claude CLI's streaming stdout and emits `stdout`-level logs
per token chunk, ordered against the existing `WRITE` system events. The
cinema-side panel renders those chunks into a code surface, animates them
in line-by-line, and applies syntax highlighting + a rainbow line-arrival
sweep on each newly-arrived line.

**Visual treatment**: Prism-based syntax highlighting (lightweight, ~30KB
gzipped, covers html/css/js/ts/tsx for the four existing build types) +
a one-time rainbow stripe sweep across each newly-rendered line before it
settles into its syntax color. Adds one npm dep (Prism or a hand-trimmed
subset). Reduced-motion replaces the sweep with an opacity fade.

### Rejected alternatives (recorded for traceability)

- **Path A — WRITE log carries content**: smallest change but per-file, not
  per-token. Files snap in all at once when each WRITE fires. Cheaper but
  doesn't deliver the "craftsman writing in front of you" feeling Luis
  described.
- **Path B — new worker GET endpoint, cinema fetches**: same per-file
  aesthetic as A with more moving parts. No reason to pick over A.
- **Path D — retroactive replay from deploy URL**: zero worker change but
  the animation runs AFTER deploy, not during. Defeats the live feeling.

### Aesthetic alternatives rejected

- **Rainbow only, no syntax highlighting**: less legible; feels like a
  screensaver.
- **Syntax highlighting only, no rainbow**: clean but loses the showmanship
  the user wants.

---

## What this is — and isn't — yet

**This document is a diagnosis + locked approach.** It is NOT:
- A spec section detailing FRs and acceptance scenarios.
- A plan with Constitution Check + Phase 0 research.
- An implementation task list.
- Code.

All four follow once design begins, per the spec-toolkit gate flow. Per
the user's GATE 3 directive: **Phase B does not start until Phase A is
preview-validated.** This document is the input to the eventual Phase B
spec section + plan.

---

## Worker-side scope (out-of-repo dependency)

The Path C unlock requires changes to the engineering-worker repo
(Railway). Scope outline (NOT a worker-repo spec — Luis owns that):

1. Wrap the Claude CLI subprocess to capture its streaming stdout.
2. Emit `stdout`-level logs per chunk to `conduit_engineering_logs` with a
   structured prefix (e.g. `[file:<path>] <chunk>` or a new system-log
   sentinel `STREAM_START <path>` … `STREAM_END <path>` that brackets the
   chunked stdout).
3. Preserve ordering against existing `WRITE <path>` events so the cinema
   can attribute chunks to files.
4. Bound chunk volume (per-chunk min size, or aggregate-then-emit at e.g.
   200ms intervals) to avoid drowning the realtime channel.
5. Confirm signed-write security: cinema must trust that what it renders
   is what the worker actually wrote.

**Open questions for worker-side scoping** (deferred to Phase B spec
authoring — NOT answered here):

- Does Claude CLI expose a streaming flag? If not, the worker may need to
  use the Anthropic SDK directly instead of the CLI. That is a bigger lift.
- How to handle the case where Claude generates content that does NOT
  result in a file write (e.g. internal reasoning, abandoned edits)? Filter
  or surface?
- Ordering invariant: per-chunk stdout must arrive BEFORE the matching
  `WRITE <path>` system log so the cinema doesn't show a "file complete"
  marker before the stream finishes. Worker-side guarantee needed.

---

## Cinema-side scope (in-repo)

Sketch only — full FRs land when Phase B spec is authored:

- New panel in `src/components/conduit/builds/cinema/`, name TBD —
  candidate: `BuildCodeStream.tsx`. Lives between `BuildCraftStrip` and
  `BuildPreviewStage`, OR replaces a portion of `BuildCraftStrip` (TBD).
- Tab strip across the top showing each touched file; clicking a tab
  switches the rendered file. Active file follows the most-recent stream
  by default.
- Code body: monospace, line-numbered, Prism-tokenized.
- New-line animation: 280ms enter (slide + opacity) + 600ms rainbow stripe
  sweep before settling into syntax color.
- Auto-scroll-to-bottom while streaming (Phase A craft strip already has
  this pattern).
- Reduced-motion replaces both animations with opacity fade.
- One new npm dep: Prism (or `prismjs` + selected language bundles only).
  Re-evaluates Spec Assumption 5 ("zero new dependencies") for Phase B
  specifically. Justification: syntax highlighting in-house would be
  brittle and bloated; Prism is the established convention.

---

## Gate state

This work is **gated** behind:

1. Phase A preview validation (current — Luis is running real builds).
2. A worker-repo PR landing Path C's per-chunk stdout emission.
3. A Phase B spec section + plan + tasks (full spec-toolkit gate flow)
   authored once #1 and #2 are firm.

No code is written until those three gates clear.

---

## Source data

The diagnosis above is grounded in direct DB queries against the Lunaro
build session. Reproducer (RLS-scoped to Luis's account; runs from the
Supabase MCP):

```sql
SELECT ts, level, message
FROM conduit_engineering_logs
WHERE session_id = 'b81aea12-418d-493f-9f55-cb71be4aa7d5'
ORDER BY ts ASC;
```

If a future build emits content-bearing logs (i.e. someone ships Path C
upstream without coordinating with this spec), re-run this query, update
the diagnosis section, and revisit the locked approach.
