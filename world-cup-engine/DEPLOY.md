# Deploy Guide — Self-Hosted Auto-Video Engine (~1 hour, ~$15–50/mo)

Follow top to bottom when you're at a computer. No coding — copy/paste commands.
End state: a machine that turns a script into a finished MP4 (voice + captions +
music) and uploads it to your YouTube channel as a private/scheduled draft for you
to tap-publish.

> Why private-then-publish: YouTube only lets *unaudited* API apps upload as private.
> That's fine — it's the approval gate that also keeps us off the "inauthentic
> content" ban list. You tap publish from the YouTube app in ~30s/video.

---

## Step 0 — Accounts you'll need (all free to start)
- A **Google Cloud** account (for the YouTube Data API) — free.
- A **VPS**: Contabo (~$5/mo) or Hetzner (~$7/mo). Pick the cheapest 2 vCPU / 4–8 GB Ubuntu box.
- A **TTS choice**: start with **edge-tts** (free) — upgrade to ElevenLabs later if you want a richer voice.
- (Optional) a cheap **image API** (fal.ai Flux Schnell ~$0.003/image) OR keep using the generation engine already connected here.

## Step 1 — Spin up the VPS (10 min)
1. Create an Ubuntu 24.04 server on Contabo/Hetzner.
2. SSH in (the host emails you the IP + password), then install Docker:
   ```
   curl -fsSL https://get.docker.com | sh
   ```

## Step 2 — Bring up n8n + the renderer (one command) (10 min)
Copy `automation/docker-compose.yml` and `automation/.env.example` onto the VPS,
rename the env file and fill it in:
```
cp .env.example .env
nano .env            # paste your free Pexels API key (pexels.com/api)
docker compose up -d
```
That starts both services. Open **n8n** at `http://YOUR_SERVER_IP:5678` (create a
login) and the **renderer** runs on `:3123`.
Renderer repo/options: https://github.com/gyoridavid/short-video-maker

> For long-form (8–15 min) docs later, add **MoneyPrinterTurbo**
> (https://github.com/harry0703/MoneyPrinterTurbo) as a second renderer service — same idea.

## Step 3 — Import the starter workflow (5 min)
In n8n: **Workflows → Import from File →** `automation/n8n-workflow.json`. It pre-builds
the Schedule → Script → Render → YouTube-upload chain. You'll finish the credentials in
Step 4–5. Node-by-node detail is in `automation/workflow-blueprint.md`.

## Step 4 — YouTube Data API (15 min)
1. console.cloud.google.com → New Project → enable **YouTube Data API v3**.
2. Create an **OAuth client ID** (type: Web app). Add the n8n redirect URL n8n shows you.
3. In n8n: Credentials → **YouTube OAuth2** → paste client ID/secret → authorize your channel.
4. Leave the app **unverified for now** → uploads land as **private**. (Optional later: submit the compliance audit to allow direct-public.)

## Step 5 — Import the workflow (10 min)
1. In n8n: Workflows → Import → paste the blueprint from `automation/workflow-blueprint.md`.
2. Set the schedule (e.g., 5 Shorts/day + 1 long-form/week).
3. Drop the prompts from `automation/prompts.md` into the LLM nodes.
4. Run once manually → check a private video appears on your channel → tap publish.

## Step 6 — Feed it the backlog
The `episodes/` folder has ready scripts. Either paste them into the workflow's
"script" input, or point the LLM node at the bucket prompt to auto-write new ones in
the same style. The `content-calendar.md` says what posts when.

---

## Monthly cost (this build)
| Item | Cost |
|---|---|
| VPS | $5–15 |
| n8n (self-host) | $0 |
| Renderer | $0 |
| TTS (edge-tts free, or Google ~$2) | $0–2 |
| Images (Flux Schnell, ~900/mo) | $3–23 |
| YouTube upload API | $0 |
| **Total** | **~$15–50/mo** |

Avoid AI *video* clips (they'd push this to ~$280/mo). Stick to still images + the
Ken Burns ffmpeg move in `automation/workflow-blueprint.md`.
