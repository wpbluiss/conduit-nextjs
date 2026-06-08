# World Cup Content Engine

A 24/7 trend-monitoring + **original** short-form content system built to grow a
faceless World Cup YouTube channel during the 2026 tournament — fast enough to
ride viral moments, safe enough to survive YouTube's 2025–2026 enforcement.

Built: 2026-06-08 (World Cup kicks off in ~3 days).

---

## The one rule that keeps this channel alive

**We never upload content we don't own the rights to.** No match highlights, no
copyrighted songs (no Shakira track, no IShowSpeed track), no reposting other
people's viral clips. Every reason, with receipts, is in
[`STRATEGY.md`](./STRATEGY.md#why-no-footage).

Short version:
- Match footage = FIFA/broadcaster **Content ID** → copyright strikes → **3 strikes = channel deleted** (usually within days on a new channel).
- Copyrighted music = label Content ID → **100% of revenue diverted to the rights holder** → you earn **$0** even on viral views.
- Reposting viral clips = **"inauthentic / reused content"** → the exact policy YouTube used in Jan 2026 to terminate channels with 4.7B combined views.

What we DO instead: ride the *same* viral moments with **original commentary,
breakdowns, data graphics, and AI-generated visuals.** Same topicality, zero
strikes, you keep 100% of the revenue.

---

## What's in here

| File | What it is |
|------|------------|
| [`STRATEGY.md`](./STRATEGY.md) | The 30-day growth plan: the Shorts-views monetization path, content pillars, posting cadence, the newsjacking playbook, and the legal guardrails. |
| [`PIPELINE.md`](./PIPELINE.md) | System architecture: the 24/7 trend radar → script → video → thumbnail → SEO → **approval gate** → publish loop, and which connected tools power each stage. |
| [`samples/short-001.md`](./samples/short-001.md) | A complete, render-ready sample Short (hook, script, shot list, on-screen text, thumbnail, title/description/tags) in the viable format. |

---

## Status

- [x] Strategy + guardrails defined
- [x] Pipeline architecture designed
- [x] First sample Short package written (render-ready)
- [ ] Render sample MP4 — **blocked**: the video-generation MCP engine
      disconnected mid-session. Re-run the render step once it reconnects.
- [ ] Wire publishing — **gap**: no direct YouTube-upload tool is connected.
      Either set up the YouTube Data API (channel OAuth) or publish manually
      from the ready-made queue. See [`PIPELINE.md`](./PIPELINE.md#publishing).

## Honest expectations

The realistic 30-day win is **qualifying for monetization** (the 3M Shorts
views / 90-day entry tier is reachable in a hot niche) and banking subs +
watch-hours — not a big payout *within* the month. Anyone promising
money-in-30-days is selling you something. The asset we're protecting is the
channel itself; a deleted channel is worth $0, which is why the guardrails are
non-negotiable.
