# Voice Picks — Conduit AI Employees

Stock ElevenLabs voices selected per department personality.
Picks landed in `conduit_employee_default_voices` on 2026-05-07.
Swap any during testing — the table is the single source of truth;
worker reads from it on every session join.

| Employee     | Voice                           | voice_id                  | Why                                                                                                                                |
| ------------ | ------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| jarvis       | Mark – Natural Conversations    | `UgBBYS2sOqTuMpoF3BR0`    | (Pre-seeded.) Casual young-adult American male, ElevenLabs labels it "Perfect for Conversational AI" — fits the chief-of-staff hub. |
| sales        | Adam – Dominant, Firm           | `pNInz6obpgDQGcFmaJgB`    | Bright tenor that "immediately cuts through. Brash and openly confident." Closer energy without veering into pushy.                |
| engineering  | Eric – Smooth, Trustworthy      | `cjVigY5qzO86Huf0OWal`    | ElevenLabs explicitly tags this voice "perfect for agentic use cases." Smooth tenor, mid-40s — calm + precise without sounding stiff. |
| marketing    | Jessica – Playful, Bright, Warm | `cgSgspJ2msm6clMCkdW9`    | "Young and popular, perfect for trendy content." Warm + creative without going saccharine.                                          |
| finance      | Matilda – Knowledgeable, Pro    | `XrExE9yKIg1WjnnlVkGX`    | "Pleasing alto pitch... professional." Measured + trustworthy — the voice you want talking through P&L.                            |
| compliance   | Daniel – Steady Broadcaster     | `onwK4e9ZLuTAKqWW03F9`    | British male, "strong voice perfect for delivering a professional broadcast." Authoritative without being scary.                   |
| hr           | Lily – Velvety Actress          | `pFZP5JQG7iQjIQuC4Bku`    | British female with "warmth and clarity." Approachable and friendly — HR-coffee-chat energy, not corporate-rep energy.              |
| ops          | Charlie – Deep, Confident       | `IKne3meq5aSn9XLyUdCD`    | Australian male, "confident and energetic." No-nonsense + faintly outsider, gives ops a different cadence from the rest.            |
| legal        | George – Warm Storyteller       | `JBFqnCBsd6RMkjVDRZzb`    | "Warm resonance that instantly captivates." Mid-aged British male — gravitas the way a careful counsel sounds.                     |

## Validation

```sh
$ curl -s "https://api.elevenlabs.io/v1/voices/<id>" -H "xi-api-key: $KEY"
```

All 9 IDs verified live against the project's voice library on
2026-05-07. They're all stock public-library voices, no custom
clones, so the same IDs work on any ElevenLabs subscription tier
(Starter and up — free tier still hits `payment_required` on
streaming WS).

## Swap path

Either:

1. SQL: `UPDATE conduit_employee_default_voices SET voice_id = '<new>' WHERE employee = '<role>';`
2. Per-account override (existing R5 mechanism): insert into
   `conduit_employee_voices (account_id, employee, elevenlabs_voice_id)`.
   The token route's resolver already prefers per-account override
   over the global default.

Worker picks up the change on the next session — no redeploy
needed.
