# Sample Short #001 — "Breaking-take" newsjack template

This is the render-ready package the engine produces. It's the **viable** version
of your "be on top of every viral moment" idea: same speed and topicality, but
built from **original** narration + AI-generated visuals, so it survives Content
ID and keeps 100% of the revenue.

Below is the reusable template, filled with one concrete example. The agent swaps
the `{{EVENT}}` block for whatever real, verified moment the radar surfaces.

---

## Example fill: group-stage opener hype (evergreen, always safe)

**Trigger:** Tournament kickoff in 3 days (no rumor risk — pure hype).
**Format:** 28-second vertical Short.
**Predictor pre-check:** run before render; target hook score high, retention
curve flat-to-rising.

### Hook (0:00–0:02)
> **VOICEOVER:** "This is the most stacked World Cup group in 20 years — and
> nobody's talking about it."
> **ON-SCREEN (big, center):** "THE GROUP OF DEATH 💀"

### Body (0:02–0:22)
| Time | Voiceover | On-screen text | Visual (generated, original) |
|------|-----------|----------------|------------------------------|
| 0:02–0:08 | "Three former champions. One spot. Someone goes home in the first week." | "3 EX-CHAMPIONS · 1 SPOT" | Stadium-at-night render, crowd haze, dramatic push-in |
| 0:08–0:14 | "Look at the numbers — combined, these squads are worth over two billion." | "€2B+ ON THE PITCH" | Animated counter ticking up, original motion-graphics |
| 0:14–0:22 | "And the opener? Two teams that haven't met at a World Cup since the 90s." | "FIRST MEETING SINCE '98" | Split-screen crest-style graphics (original shapes, no real logos) |

### Loop close (0:22–0:28)
> **VOICEOVER:** "So who's surviving this group? I've got my pick — but watch
> the opener first, because the most stacked group in 20 years starts now."
> **ON-SCREEN:** "WHO SURVIVES? 👇"
> *(Last line loops back into the hook for replays.)*

### Packaging
- **Title:** `The "Group of Death" Nobody Is Talking About 💀 #WorldCup2026`
- **Description:**
  > The 2026 World Cup might have the most stacked group in 20 years. Three
  > former champions, one qualifying spot, €2B+ of talent. Here's why the opener
  > matters. Who's your pick to survive? 👇
  > #WorldCup2026 #WorldCup #Soccer #Football #FIFA
- **Tags:** `world cup 2026, world cup, group of death, soccer, football, fifa, world cup predictions, group stage`
- **Thumbnail (generated):** dark stadium, glowing "💀" + text "GROUP OF DEATH",
  high contrast — original art, no real player images or logos.

### Asset checklist (all original — nothing copyrighted)
- [ ] 3–4 generated background clips (stadium, crowd, abstract pitch) → `generate_video`
- [ ] 1 generated thumbnail → `generate_image`
- [ ] Original motion-graphics counters / text (no real crests or player photos)
- [ ] TTS voiceover (licensed/own voice)
- [ ] Royalty-free / owned music bed (NOT Shakira / IShowSpeed / any label track)
- [ ] `reframe` → 9:16, `upscale_video` → clean output

---

## The reusable template (what the agent runs daily)

```
HOOK (0–2s):     {{contrarian or high-stakes claim about the verified event}}
BODY (2–22s):    3 beats, each = 1 original fact/number + 1 generated visual + moving text
LOOP (22–28s):   restate the stakes + soft CTA that feeds back into the hook
TITLE:           one bold claim + #WorldCup2026
THUMB:           1 number or symbol + 3 words, high contrast, original art
RULE:            verified events only · original visuals only · owned/royalty-free audio only
```

> **Render status:** blocked until the video-generation MCP engine reconnects.
> All copy/shot-list/SEO above is final and ready; the produce step (5) runs the
> moment the engine is back.
