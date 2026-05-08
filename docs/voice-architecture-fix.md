# Voice Architecture Fix — Atlas mid-sentence cutoff (2026-05-08)

## Symptom

Atlas (and other voices in solo mode) cut themselves off mid-sentence,
particularly on longer responses. The interrupt feels self-inflicted —
the user did not speak, but the agent stopped talking and went silent.

Round 1 (2026-05-07) tuned three knobs:

1. RMS gate `0.005 → 0.015`
2. Realtime `server_vad` threshold `0.8 → 0.9`, silence_duration `600 → 1000ms`
3. Disabled browser-side `autoGainControl` on the publish track

The bug persisted. Knob-tuning isn't fixing it because the architecture
has a flaw, not a parameter problem.

## Investigation

Pulled railway logs for `conduit-voice-worker`. Recent Atlas sessions
were short (≈22 s, `reason=user_left`) so log evidence alone wasn't
conclusive — but reading the worker's interrupt path against the TTS
bridge made the failure mode obvious.

### Hypotheses

| # | Hypothesis | Verdict |
|---|------------|---------|
| A | Echo: agent's own outbound audio leaking into LiveKit inbound track | Plausible **mechanism** of the leak, but addressing it browser-side is unreliable across devices. Not the **architectural** flaw. |
| B | Realtime VAD oversensitivity: server VAD fires even with high threshold because we feed it audio contaminated with agent echo | **Confirmed.** The worker is reactive — it lets VAD fire, then tries to second-guess "was that real?" with cooldown + RMS gate. Both are best-effort heuristics; both have edge cases that get through. |
| C | Cooldown timer too short for slow networks | Not the root cause — bumping it to 1500 ms didn't fix it. Symptom not network-bound. |

### Root cause

In `agent.ts`, the gating is applied **after** `user_speech_started`
has already fired:

```
mic frame → Realtime input buffer → server_vad → user_speech_started
                                                       │
                                          (then we decide: "real?")
                                          ├─ in cooldown? ignore
                                          └─ recent RMS energy? ignore otherwise
```

The fundamental flaw: the OpenAI Realtime API's server VAD evaluates
whatever audio we feed it. We're feeding it audio that contains
agent-voice echo (browser AEC half-cancels it; AGC, room acoustics,
and onset transients leak through). Even with `threshold=0.9`, the VAD
fires on those echoes — and our reactive filters miss enough of them
to cut Atlas off.

There's also a worse case visible in the code that the round-1 knobs
don't even guard against: `agentSpeaking` flips to `false` on the
Realtime `text_done` event, but **TTS audio continues streaming for
seconds afterward** (ElevenLabs is still pushing PCM to LiveKit).
During that trailing window, the cooldown is over, the energy gate is
neutral, and any echo will trigger `user_speech_started`. The handler
returns early because `!agentSpeaking`, but server VAD has already
committed the buffered echo, so the Realtime session may auto-create
a *response to its own echo* before the previous turn's audio has
even drained from the user's speakers.

## Fix

**Proactive audio gating, not reactive interrupt suppression.** Don't
ship user mic audio to Realtime while the agent is producing audio.
The server VAD can't fire on audio it doesn't receive.

A simple two-state gate, driven by a state machine that knows when
audio is *actually* draining (not just when text generation finishes):

```
[listening]  ── agent first text_delta ─────►  [gated]
[gated]      ── tts 'done' + drain timer ──►  [listening]
[gated]      ── sustained user RMS > T ────►  [listening]   (real interrupt)
```

While `gated`:
- Do **not** call `realtime.appendAudio(buf)`.
- On every frame, measure RMS. If RMS ≥ `INTERRUPT_RMS_THRESHOLD`
  (0.04 — well above echo-AEC residue, comfortably below normal
  speech) for `INTERRUPT_SUSTAIN_FRAMES` consecutive frames (5 ×
  20 ms = 100 ms), treat as a real interrupt: cancel the agent
  response, abort TTS, open the gate, and forward the audio so
  Realtime sees the user's interrupting speech.

Gate transitions:
- First `text_delta` → `gated`. (Agent has begun producing audio.)
- TTS `done` event (ElevenLabs `isFinal:true` or stream close) →
  schedule open after `POST_TTS_DRAIN_MS` (800 ms — covers WS-close
  delay + LiveKit publish queue + browser playback latency).
- Fallback: if TTS `done` never arrives, open gate 5 s after `text_done`.

This eliminates **both** failure modes:
- VAD jitter / echo during agent speech can't fire `user_speech_started`
  because no audio reaches Realtime.
- The trailing-TTS window is now also gated, so echoes during audio
  drain can't trigger spurious response auto-creation.

## What is removed

- `lastUserAudioAt` + `USER_AUDIO_ACTIVE_WINDOW_MS` energy gate —
  redundant once audio is gated proactively.
- `INTERRUPT_COOLDOWN_MS` — redundant, the gate covers the entire
  agent-speaking window cleanly.
- The `if (!this.agentSpeaking) return` guard at the top of
  `user_speech_started` — `user_speech_started` will now only fire
  during listening (because that's the only time audio reaches
  Realtime), so it always means real user speech.

Round-table mode keeps the same gate; the per-turn TTS swap fits the
state machine without modification.

## Verification plan

Live-test against Atlas on `/app/voice` after deploy:

1. Ask "tell me about my pipeline in detail" — expect a multi-sentence
   response without cut-off; worker logs show
   `[agent] audio gate closed/opened` transitions, no spurious
   `user_speech_started` events while gated.
2. Mid-response, speak clearly: agent should stop within ~150 ms;
   logs show `[agent] interrupt confirmed (sustained voice during gated state)`.
3. Mid-response, make a non-voice noise (cough, keyboard) — agent
   should NOT stop; logs show no interrupt confirmation.
4. After agent finishes, immediately speak again — gate should be
   open (post-drain timer elapsed); normal back-and-forth resumes.
