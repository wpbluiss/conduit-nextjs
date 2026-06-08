# Research: End-to-End Faceless Video Automation + Competitor Playbook (June 2026)

Cited research across 5 angles: open-source tools, where to run them, policy/copyright
safety, audio/TTS, and what's working for competitor channels. Bottom-line stack
recommendation at the top.

---

## TL;DR — the recommended stack

**Goal:** a non-coder, can't-edit, near-free pipeline that makes *finished* MP4s
(voice + captions + music) for both Shorts and long-form, copyright-safe, and posts
to YouTube.

**No single open-source tool does the whole job** (render + upload). The winning
pattern is **a free renderer + n8n for the upload step**:

| Path | What it is | Cost | Best for |
|------|-----------|------|----------|
| **A — Self-host (recommended long-term)** | **n8n (free)** on a **~$5/mo VPS** + **short-video-maker** or **MoneyPrinterTurbo** renderer + **edge-tts/Google TTS** + **still images w/ ffmpeg Ken Burns** + YouTube Data API upload | **~$15–50/mo** all-in | Full control, cheapest at volume. Needs a one-time ~1hr setup on a computer. |
| **B — Buy SaaS (fastest start)** | **AutoShorts.ai** auto-generates + auto-posts daily, zero infrastructure | **~$19–69/mo** flat | Posting *today* with no setup. Less control; watch templated-sameness risk. |

**The cost rule that makes it near-free:** use **still AI images + ffmpeg pan/zoom
(Ken Burns)**, NOT AI video clips. Images-only ≈ $15–50/mo; AI video clips blow it
up to ~$250–300/mo. ([atlascloud](https://www.atlascloud.ai/blog/guides/cheapest-ai-video-generation-api-2026))

---

## 1. Open-source end-to-end tools (ranked)

| Tool | Finished MP4 (audio+captions) | Short/Long | TTS | Auto-upload | Maintained | Non-coder setup |
|------|---|---|---|---|---|---|
| **MoneyPrinterTurbo** ⭐ | Yes | Short | Edge-TTS (free) | No (add n8n) | ~82k★, v1.2.9 May 2026 | 2–3 |
| **short-video-maker** (gyoridavid) | Yes | Short | Kokoro (free) | No (MCP/REST→n8n) | ~1.2k★, active | 2 (Docker) |
| **n8n + JSON2Video/Creatomate** | Yes | Both | ElevenLabs/OpenAI (paid) | **Yes** | Large 2026 template lib | 2–3 (paid render credits) |
| **ShortGPT** | Yes | **Both** | Edge-TTS (free) | Partial (metadata only) | ~7.4k★, slowed (Feb 2025) | 3–4 |
| **Remotion / Revideo** | Yes (if you code it) | Both | DIY | No | Active | 5 (needs dev) |

- Sources: [MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo), [short-video-maker](https://github.com/gyoridavid/short-video-maker), [ShortGPT](https://github.com/RayVentura/ShortGPT), [n8n auto-publish template](https://n8n.io/workflows/3442-fully-automated-ai-video-generation-and-multi-platform-publishing/), [Remotion vs Revideo](https://www.pkgpulse.com/blog/remotion-vs-motion-canvas-vs-revideo-programmatic-video-2026).
- **Skip:** `auto-shorts` (archived Jan 2025). Note SamurAIGPT's "AI-Youtube-Shorts-Generator" is a clip-repurposer, not a generator.

## 2. Where to run it (cheap, non-coder)

- **VPS (CPU-only is enough** if TTS + images are via cloud APIs): Contabo ~$5/mo, Hetzner ~$7/mo, DigitalOcean ~$6/mo. ([bitsfrombytes](https://bitsfrombytes.com/cheap-vps-hosting-2026-testing-guide/))
- **Orchestration:** **self-hosted n8n = free, unlimited runs** (Docker on the VPS). n8n Cloud $24/mo. Make.com ~$9–10/mo (easiest). **Avoid Zapier** (per-step billing, $300+/mo equivalent). ([n8n pricing](https://n8n.io/pricing/), [toolradar](https://toolradar.com/blog/zapier-pricing-2026))
- **Colab is NOT suitable** for daily posting (disconnects, no cron). GPU only needed for *local* AI video gen (which we're avoiding).

## 3. YouTube policy + copyright (the guardrails)

- **Uploads are FREE.** Default quota 10,000 units/day. **Dec 2025: a video upload dropped from ~1,600 → ~100 units**, so the free default now allows **~100 uploads/day** — your 5–6/day fits easily. ([getphyllo](https://www.getphyllo.com/post/youtube-api-limits-how-to-calculate-api-usage-cost-and-fix-exceeded-api-quota), [blotato](https://www.blotato.com/blog/youtube-api-pricing))
- **Caveat: public-via-API requires a compliance audit.** Unaudited apps (created after Jul 2020) can only upload as **private** — so the realistic flow is *auto-generate → auto-upload as private/scheduled → you tap publish* (matches the approval-gate plan). ([Google audits](https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits))
- **Automating your OWN uploads is allowed; automating likes/views/comments is a ToS violation.** ([dev policies](https://developers.google.com/youtube/terms/developer-policies))
- **"Inauthentic content" policy (renamed Jul 15 2025):** templated, mass-produced, low-variation content is demonetized. **AI is allowed** with meaningful human involvement + original writing per episode. ([support](https://support.google.com/youtube/answer/1311392), [socialmediatoday](https://www.socialmediatoday.com/news/youtube-clarifies-monetization-update-inauthentic-repeated-content/752892/))
- **Enforcement is real:** ~12M channels terminated in 2025; **Jan 2026** wiped ~16 large faceless AI channels (~35M subs, ~4.7B views) for templated/volume-over-substance. ([dexerto](https://www.dexerto.com/youtube/youtube-responds-to-ai-concerns-as-12-million-channels-terminated-in-2025-3292911/))
- **Copyright:** match footage (FIFA/broadcaster Content ID) + popular songs → revenue **diverted to rights holder** (you earn $0 on that video); manual strikes → **3-in-90-days = channel deleted**. Leagues (UEFA/PL) do issue real strikes. ([epikton](https://epikton.net/content-id-vs-copyright-claim-vs-strike/), [support](https://support.google.com/youtube/answer/2814000))
- **AI disclosure** (realistic synthetic visuals) is required but **does NOT hurt monetization/reach**. We label and move on. ([support](https://support.google.com/youtube/answer/15447836))
- **2026 YPP:** Entry (Super Thanks/memberships): 500 subs + 3 uploads/90d + 3,000 watch-hrs **or 3M Shorts views**/90d. Full (ad revenue): 1,000 subs + 4,000 watch-hrs **or 10M Shorts views**. ([support](https://support.google.com/youtube/answer/72851))

## 4. Audio + TTS

- **Use voiceover/original audio** to keep full Shorts ad revenue; trending licensed songs (the Shorts "add sound" picker) siphon 1/2 (1 track) to 2/3 (2 tracks) of revenue to music licensing. ([creatipi](https://www.creatipi.com/blog/youtube-shorts-revenue-sharing-explained/))
- **Never reuse Shorts-picker audio in long-form** → Content ID claims/strikes. ([gyre](https://gyre.pro/blog/using-trending-audio-legally-a-guide-for-youtube-creators))
- **Safe music (monetizable, both formats):** YouTube Audio Library, Pixabay, Uppbeat, Epidemic Sound — verify it's not Content-ID-registered. ([vidiq](https://vidiq.com/blog/post/royalty-free-music-youtube-audio-library/))
- **Free good TTS:** **edge-tts** (Microsoft neural, free, near-Azure) or **Kokoro** (open-source, self-host). **ElevenLabs** = most natural ($5–22/mo). For ~400K chars/mo, Google Standard TTS ≈ **$1.60/mo**, OpenAI ≈ $6/mo, ElevenLabs ≈ $120/mo. ([elevenlabs](https://elevenlabs.io/pricing), [edge-tts](https://github.com/travisvn/openai-edge-tts), [tokenmix](https://tokenmix.ai/blog/tts-api-comparison))

## 5. Competitor playbook — what's working (replicate this)

**Model channels:** The Football Documentary Channel (series buckets), Tifo Football
(illustrated explainers — copyright-safe), Copa90 (fan-narrative docs), HITC Sevens
(listicle→doc), and **LEMMiNO** (faceless-doc gold standard).
([footballdocumentaries](https://footballdocumentaries.com/), [Tifo/storybench](https://www.storybench.org/how-tifo-football-is-making-soccer-analytics-more-easy-to-digest/), [narrationbox](https://narrationbox.com/blog/faceless-youtube-channel-ideas-that-actually-work))

**The formula:**
1. **3 evergreen buckets:** Forgotten Players ("what happened to…") · Disasters & Scandals · Rivalries & Underdogs.
2. **Long-form (8–15 min):** AI script + documentary-narrator TTS, **rise-and-fall arc**, hook the tragedy/twist in the **first 5–10s**, visuals = AI images/illustration (avoids strikes vs raw footage). ~$3/video achievable. ([unkoa](https://www.unkoa.com/faceless-youtube-10000-month-2025/))
3. **Shorts (15–35s):** clip 5–7 from each long-form; **text-first hook in frame 1** (<3s, 50–60% drop there), single shocking fact, looped payoff. ([opus.pro](https://www.opus.pro/blog/youtube-shorts-hook-formulas))
4. **Thumbnails:** emotional face + **1–4 curiosity-gap words** ("WHY HE VANISHED"); 1280×720, 2–3 bold colors. Faces w/ emotion ≈ +38% engagement; good CTR (6–10%) grows ~2.3x faster. ([clickyapps](https://clickyapps.com/creator/thumbnails/guides/youtube-thumbnail-best-practices))
5. **Cadence:** **1 long-form/week + ~18–22 Shorts/month** (near-daily). Hybrid grows ~41% faster than long-only; Shorts-only earns ~95% lower CPM. ([virvid](https://virvid.ai/blog/faceless-shorts-dominance-strategy-2026), [air.io](https://air.io/en/youtube-hacks/the-death-of-daily-uploads-what-cadence-actually-triggers-algorithm-love-in-2025))
6. **Over-performing stories:** tragedies (Escobar), rivalries (Boca–River), underdogs (Iceland/Leicester), scandals/disasters (Brazil 7–1), forgotten players. Lean on **2026 World Cup + anniversary pegs**.

**Reality check:** faceless success rate ~3%; typically **7–10 months** to algorithm traction. ([frameloop](https://frameloop.ai/blog/faceless-youtube-statistics-2026)) The 1-month goal is *qualify + bank audience*, not payout.

---

## Recommended next action

Adopt **Path A** (self-host n8n + short-video-maker, ~$15–50/mo, full control), with
**AutoShorts.ai** as an optional same-day fallback. The self-host stack needs a
one-time ~1-hour deploy on a computer — everything else (content system, scripts,
prompts, the n8n workflow) can be prepared in advance and committed here.
