// Streaming TTS via ElevenLabs Turbo v2.5.

export interface TTSOptions {
  text: string;
  voiceId: string;
  speed?: number;
}

export function isVoiceConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

export class TTSUpstreamError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string) {
    super(`tts_upstream_${status}`);
    this.status = status;
    this.body = body;
  }
}

export async function streamTTS(opts: TTSOptions): Promise<Response> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("VOICE_NOT_CONFIGURED");

  const speed = Math.max(0.5, Math.min(2.0, opts.speed ?? 1.0));

  // Voice settings — `speed` is only honored on newer Turbo models. We send
  // it conditionally so we don't 422 against older endpoints.
  const voice_settings: Record<string, unknown> = {
    stability: 0.5,
    similarity_boost: 0.75,
  };
  if (Number.isFinite(speed) && speed !== 1.0) {
    voice_settings.speed = speed;
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(opts.voiceId)}/stream?optimize_streaming_latency=2`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: opts.text,
        model_id: "eleven_turbo_v2_5",
        voice_settings,
        output_format: "mp3_44100_128",
      }),
    },
  );
  if (!response.ok || !response.body) {
    const body = await response
      .text()
      .catch(() => "");
    throw new TTSUpstreamError(response.status, body.slice(0, 300));
  }
  return response;
}

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category?: string;
  labels?: Record<string, string>;
}

let voicesCache: { fetched: number; voices: ElevenLabsVoice[] } | null = null;
const VOICES_TTL_MS = 60 * 60 * 1000; // 1h

export async function fetchVoices(): Promise<ElevenLabsVoice[]> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return [];
  if (voicesCache && Date.now() - voicesCache.fetched < VOICES_TTL_MS) {
    return voicesCache.voices;
  }
  const r = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": apiKey },
  });
  if (!r.ok) return voicesCache?.voices ?? [];
  const j = (await r.json()) as { voices?: ElevenLabsVoice[] };
  const voices = j.voices ?? [];
  voicesCache = { fetched: Date.now(), voices };
  return voices;
}
