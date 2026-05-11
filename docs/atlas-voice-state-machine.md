# Atlas voice state machine — round 2 (2026-05-10)

This document follows up on `voice-architecture-fix.md` (the Friday 2026-05-08
ship, commit `1f934b5` in `conduit-voice-worker`). That commit introduced a
proactive audio gate. The state machine *as implemented* still cuts off mid-
response in some sessions, so the goal here is:

1. Describe the gate as it actually exists today, in plain English.
2. Trace the lifecycle of one Atlas response end-to-end.
3. Identify the *architectural* failure mode that survives Friday's fix.
4. Specify the round-2 fix.

---

## 1. The gate today (commit `1f934b5`)

The agent (`agent.ts` in `conduit-voice-worker`) implements a two-state
gate on user microphone audio:

```
States: { listening, gated }

Transitions:
  listening → gated:    first response.text.delta arrives
  gated     → listening:  ElevenLabs 'done' fires, then 800ms drain timer
  gated     → listening:  5s text_done fallback (belt-and-braces)
  gated     → listening:  confirmed interrupt
                          (≥5 consecutive frames @ RMS ≥ 0.04 within `gated`)
```

While **listening**, every mic frame is forwarded to the OpenAI Realtime
WebSocket via `appendAudio()`. Server-side VAD owns turn detection.

While **gated**, no mic frame is forwarded. Server VAD therefore cannot
fire `input_audio_buffer.speech_started`, eliminating the round-1 class of
false interrupts (echo / AEC residue / VAD jitter). Real interrupts during
gated state are detected locally by sustained voice-level RMS energy.

## 2. End-to-end lifecycle of one Atlas response (solo mode, happy path)

Cast of components:

- **Browser** — mic capture + speaker playback. Runs WebRTC AEC.
- **LiveKit** — audio transport. Worker receives mic via `AudioStream`;
  publishes agent voice via `AudioSource` on a `LocalAudioTrack`.
- **OpenAIRealtimeClient** — WS to OpenAI Realtime. `modalities=['text']` —
  ingests user audio, emits text deltas. Server VAD inside Realtime.
- **ElevenLabsStreamingTTS** — WS to ElevenLabs. Text in, PCM16 24kHz audio
  out. Per-utterance stream — fresh WS per agent turn.
- **VoiceAgent** — the orchestrator. Owns the gate.

Timeline:

```
t=0     user finishes speaking. Realtime server VAD fires speech_stopped,
        commits the buffer, auto-creates a response. (solo mode: autoCreate=true)

t=10ms  Realtime: response.created.

t=20ms  Realtime: first response.text.delta.
        VoiceAgent.text_delta:
          - agentSpeaking := true
          - closeAudioGate()      → gate := "gated"
          - tts.pushText(delta)
        ElevenLabs starts generating PCM.

t=40ms+ Many more text.delta events. Each one tts.pushText'ed.
        ElevenLabs streams PCM back. VoiceAgent.publishAudio sends 20ms frames
        to LiveKit. User hears Atlas.

        Meanwhile: every inbound mic frame is being RMS-measured but NOT
        forwarded to Realtime. interruptCandidateFrames stays at 0 unless
        sustained voice arrives.

t=T     Realtime: response.text.done.
        VoiceAgent.text_done:
          - transcript.push(...)
          - publishData("transcript",…)
          - tts.end()              ← OLD tts: sends {text:""}, closes WS 200ms later
          - refreshTtsStream()      ← creates NEW tts, rewires events, this.tts=NEW
          - agentSpeaking := false
          - armGateOpenFallback()   ← 5000ms fallback to open gate

t=T+Δ   ElevenLabs flushes remaining audio chunks for buffered text.
        OLD tts: ws.message → emit("audio") → still routed to publishAudio,
                  because the OLD instance's listeners (wired before
                  refreshTtsStream) closure-capture `this.publishAudio`.

t=T+Δ′  ElevenLabs sends {isFinal: true}.
        OLD tts: emit("done").
        VoiceAgent.tts 'done' handler:
          - if gate == "gated": scheduleGateOpen(800ms).

t=T+Δ′+800ms
        Gate opens. User mic flows back to Realtime. Server VAD listens again.
```

## 3. Where the failure survives Friday's fix

The Friday fix corrected the **input side**: user mic audio no longer reaches
Realtime while Atlas is speaking, so server VAD cannot fire spurious
`user_speech_started` and trigger a reactive cancel. That mechanism is sound.

The cutoff that survives is on the **output side** — specifically, in how
`ElevenLabsStreamingTTS.end()` shuts the WS down. Today:

```ts
end() {
  if (!this.opened || this.closing) return;
  this.closing = true;
  if (this.ws?.readyState === WebSocket.OPEN) {
    this.ws.send(JSON.stringify({ text: "" }));   // flush
    setTimeout(() => this.ws?.close(), 200);       // hard close 200ms later
  } else {
    this.ws?.close();
  }
}
```

And in the `close` handler:

```ts
this.ws.on("close", () => {
  if (!this.closing) this.emit("done");
});
```

The third hidden state — call it `closing-but-not-yet-done` — is the window
between sending `{text:""}` to ElevenLabs and ElevenLabs finishing audio
generation. Two architectural problems land in this window:

**(i) Trailing audio is dropped.** The `text.delta`s that arrive in the last
~100ms before `text.done` correspond to the FINAL words of the response.
ElevenLabs still has to generate PCM for those words. Under normal latency
that takes ~150–500ms; under load it can be longer. We give it a fixed
**200ms** then `ws.close()`. If ElevenLabs hasn't sent the trailing audio
chunks before our hard close, those chunks are lost. The user hears Atlas
cut off mid-word.

**(ii) The gate-open signal never fires.** When the WS closes from our side,
`closing` is `true`, so the close handler explicitly does NOT emit `done`.
The agent's `scheduleGateOpen(800ms)` path is therefore not triggered. The
gate stays `gated` until the 5-second `POST_TEXT_DONE_FALLBACK_MS` fallback
fires — so even after a (truncated) response, the user is locked out of
talking for ~5s.

In other words: the gate is not the bug. The TTS end-flush is. Friday's
state machine is correct; its prerequisite — *that `tts 'done'` fires only
after ElevenLabs has finished sending audio* — is violated by `end()`.

### Mapping to the brief's hypotheses

| # | Hypothesis | Match |
|---|------------|-------|
| a | Server-side: TTS chunks arrive after the gate thinks streaming ended — closing the stream cuts off final audio | **Yes** — exactly the failure described above. |
| b | Client-side VAD false trigger mid-response | No — Friday's gate prevents this; mic doesn't reach Realtime. |
| c | WS frame ordering — final chunk after a "done" signal, dropped | Adjacent, but the cause isn't ordering — the cause is *our* hard close. |
| d | Two states aren't mutually exclusive in practice — third hidden state | **Yes, secondary** — `closing-but-not-yet-done` is the hidden state. |

## 4. Round-2 fix

**Close the TTS WebSocket on `isFinal:true` from ElevenLabs, not on a fixed
200ms timer. Emit `done` exactly once (idempotent), from whichever signal
arrives first (`isFinal` or socket close), so the agent's gate-open path
fires reliably.**

Concretely, in `ElevenLabsStreamingTTS`:

- Track a `doneEmitted` flag. Emit `done` from a single helper that's a
  no-op after the first call.
- In `handleMessage`, when `isFinal: true` arrives, emit `done`.
- In `ws.on('close')`, unconditionally emit `done` (idempotent). This
  catches the error / disconnect paths and guarantees the agent's
  gate-open timer arms in every case.
- In `end()`:
  - Send `{ text: "" }` to flush.
  - Wait for our own `done` (i.e., for `isFinal` from ElevenLabs).
  - Then close the WS with a small grace period for any final
    in-flight `message` frames.
  - Fallback hard-close after `MAX_FLUSH_MS = 3000` so a hung server
    never wedges us forever.

The agent side already does the right thing on `done` (scheduleGateOpen
after 800ms drain). No agent changes needed for the cutoff fix itself.

### Why this is architectural, not knob-tuning

Knob-tuning would be "bump the 200ms to 800ms" — same shape of bug, less
often. The architectural change is to drop the open-loop timer and key the
close on the server's actual `isFinal` signal. The system goes from "guess
how long generation takes" to "wait until generation is reported complete."

### Verification

1. Provoke a long Atlas response ("walk me through how I should grow my
   pipeline over the next quarter, in detail"). Expect the response to land
   in full, no trailing cut-off. Worker logs should show
   `[agent] audio gate closed` → `[agent] audio gate opened` for the same
   response, with the open transition firing ~800ms after `isFinal` was
   received from ElevenLabs (not 5s later via fallback).
2. Repeat 3× minimum, varying response length. None should cut off.
3. Mid-response, speak loudly: the existing interrupt path still cancels;
   the `[agent] interrupt confirmed` log line still appears.
4. Stay silent during a response and after: the next gate-open should
   come from the `done`-driven path, not the `POST_TEXT_DONE_FALLBACK_MS`
   fallback. If the fallback is firing in normal cases, the fix isn't
   working.
