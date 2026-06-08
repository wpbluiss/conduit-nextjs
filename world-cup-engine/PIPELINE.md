# Pipeline Architecture

A near-autonomous loop: the agent runs 24/7, but a 2-minute human approval tap
sits before publish. That single touch is what separates "scaled channel" from
"mass-produced content that gets terminated."

```
                    ┌─────────────────────────────────────────────┐
                    │  1. TREND RADAR  (always on, 24/7)           │
                    │  - News/sports APIs, RSS, social trend feeds │
                    │  - Detects verified viral WC moments         │
                    │  - Scores urgency + virality potential       │
                    └───────────────────┬─────────────────────────┘
                                        │ verified event
                                        ▼
                    ┌─────────────────────────────────────────────┐
                    │  2. FACT GATE                                │
                    │  - Confirm event from 2+ reputable sources   │
                    │  - Reject rumors/unverified (no misinfo)     │
                    └───────────────────┬─────────────────────────┘
                                        ▼
                    ┌─────────────────────────────────────────────┐
                    │  3. SCRIPT  (Claude API)                     │
                    │  - Original hook + 20–35s take + loop line   │
                    │  - On-screen text + shot list                │
                    └───────────────────┬─────────────────────────┘
                                        ▼
                    ┌─────────────────────────────────────────────┐
                    │  4. VIRALITY CHECK  (virality_predictor)     │
                    │  - Score hook/retention; kill weak concepts  │
                    └───────────────────┬─────────────────────────┘
                                        ▼
                    ┌─────────────────────────────────────────────┐
                    │  5. PRODUCE  (generate_image / generate_video│
                    │     / reframe → 9:16 / upscale_video)        │
                    │  - Original AI visuals + TTS voiceover        │
                    │  - NO copyrighted footage or music           │
                    └───────────────────┬─────────────────────────┘
                                        ▼
                    ┌─────────────────────────────────────────────┐
                    │  6. PACKAGE                                  │
                    │  - Thumbnail, title, description, tags        │
                    └───────────────────┬─────────────────────────┘
                                        ▼
                    ┌─────────────────────────────────────────────┐
                    │  7. APPROVAL GATE  ← the 2-minute human tap  │
                    │  - Notify (mobile); show preview + predictor │
                    │  - Approve / tweak / reject                  │
                    └───────────────────┬─────────────────────────┘
                                        ▼
                    ┌─────────────────────────────────────────────┐
                    │  8. PUBLISH + SCHEDULE                       │
                    │  - YouTube Data API upload (see gap below)   │
                    └───────────────────┬─────────────────────────┘
                                        ▼
                    ┌─────────────────────────────────────────────┐
                    │  9. ANALYTICS LOOP                           │
                    │  - Pull views/retention/CTR per video        │
                    │  - Feed winners back into step 3 prompts     │
                    └─────────────────────────────────────────────┘
```

## Tooling map (what's connected vs. what's missing)

| Stage | Connected tool | Notes |
|-------|----------------|-------|
| Script | Claude API | Original copy generation |
| Virality check | `virality_predictor` | Score before spending render credits |
| Visuals | `generate_image`, `generate_video` | Original assets only |
| Vertical | `reframe` | 9:16 for Shorts |
| Quality | `upscale_video` | |
| Storage | Drive-style file MCP | Stage renders + queue |
| State/analytics | Supabase MCP | Video log, performance, prompt feedback |

## Publishing <a name="publishing"></a>

**Gap:** there is **no direct YouTube-upload tool** connected to this session.
Two options:

1. **Automated** — wire the **YouTube Data API v3** with the channel's OAuth
   refresh token. Then step 8 uploads + schedules programmatically. This is the
   real "hands-off up to the approval tap" version. Requires you to create a
   Google Cloud project + authorize the channel (I can write the integration and
   walk you through the OAuth once you're ready).
2. **Manual** — the pipeline drops finished MP4 + title/desc/tags into a "ready
   to publish" queue; you upload from YouTube Studio. Zero setup, more taps.

## Trend radar — data sources (no scraping of copyrighted video)

The radar reads *text/metadata* signals, not video to repost: sports news APIs,
official team/league feeds, Google Trends, and social trend endpoints. It
surfaces the *topic*; we create the *content*.
