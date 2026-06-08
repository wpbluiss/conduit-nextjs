# Automation — Workflow Blueprint + ffmpeg Recipe

The n8n workflow that runs the daily loop. Import the structure below, then paste the
prompts from `prompts.md` into the LLM nodes.

## Workflow nodes (in order)

1. **Schedule Trigger** — fire N times/day (e.g., cron `0 9,12,15,18,21 * * *` for 5 Shorts).
2. **Pick next item** — read the next queued script from a Google Sheet / the `episodes/` backlog (a "status: pending" row). For newsjack mode, swap this for an RSS/news-trigger node (verified sources only).
3. **LLM: script** (only if not using a pre-written backlog script) — system prompt = `prompts.md › SCRIPT`. Output: hook, narration, on-screen text beats, shot list.
4. **LLM: packaging** — system prompt = `prompts.md › PACKAGING`. Output: title, description, tags, thumbnail prompt.
5. **TTS** — call edge-tts (free) or ElevenLabs. Input = narration. Output = voiceover.mp3.
   - edge-tts one-liner (run on the VPS): `edge-tts --voice en-US-GuyNeural --text "..." --write-media vo.mp3`
6. **Images** — generate 5–8 stills from the shot list (Flux Schnell via fal.ai, or the connected engine). All original — no real logos/faces/footage.
7. **Render** — POST to short-video-maker (:3123) with the images + captions, OR run the ffmpeg Ken Burns recipe below for full control.
8. **Thumbnail** — generate 1 image from the thumbnail prompt (16:9).
9. **YouTube upload** — `videos.insert`, privacyStatus = `private` (or `scheduled`). Attach title/description/tags + set `selfDeclaredMadeForKids=false` and the **"altered/synthetic content" flag** if visuals are realistic AI.
10. **Log** — write row to Google Sheet: video id, title, status, predicted hook.
11. **Notify** — push you a "ready to publish" message (Telegram/email node).

## ffmpeg "Ken Burns" recipe (cheap motion from a still — no AI video credits)

Per image (slow zoom-in over `D` seconds at 30fps, vertical 1080×1920):
```
ffmpeg -loop 1 -i img.png -t D -r 30 \
  -vf "scale=3240:5760,zoompan=z='min(zoom+0.0008,1.2)':d=D*30:s=1080x1920:fps=30,format=yuv420p" \
  -c:v libx264 clip.mp4
```
Concatenate the clips, then mux voiceover + a royalty-free music bed:
```
ffmpeg -f concat -safe 0 -i list.txt -c copy body.mp4
ffmpeg -i body.mp4 -i vo.mp3 -i music.mp3 \
  -filter_complex "[2:a]volume=0.12[m];[1:a][m]amix=inputs=2:duration=first[a]" \
  -map 0:v -map "[a]" -c:v copy -shortest final.mp4
```
Burn captions (from the TTS transcript / Whisper) with the `subtitles` filter or let
short-video-maker handle word-by-word captions automatically.

## Hard rules baked into the workflow
- **Visuals:** original AI images / stock only. No match footage. No real player photos in a way that implies real footage.
- **Audio:** voiceover + Content-ID-clear royalty-free music only (YouTube Audio Library / Pixabay / Uppbeat). Never the trending licensed songs.
- **Disclosure:** set the synthetic-content flag when visuals are realistic AI.
- **Variation:** each episode uses genuinely different writing — never a fill-in-the-blank template (this is what keeps monetization safe).
