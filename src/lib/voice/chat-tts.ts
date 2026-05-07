// R13: thin bridge between the chat route's token stream and the
// ElevenLabs streaming WS. The chat route owns SSE writes and calls
// onDelta() per token + finish() at end-of-stream; everything else —
// segmentation, WS lifecycle, audio multiplexing, char counting,
// daily-cap enforcement, fallback-on-error — lives here.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConduitAccount } from "@/lib/conduit/account";
import { defaultVoiceFor } from "@/lib/voice/defaults";
import { isVoiceConfigured } from "@/lib/voice/tts";
import { SentenceSegmenter, StreamingTts } from "./streaming-tts";

const DEFAULT_DAILY_CHAR_LIMIT = 50_000;

export interface ChatTtsConfig {
  enabled: boolean;
  voicePrefs: { voice_enabled: boolean; voice_auto_play: boolean; voice_speed: number };
  voiceOverrides: Record<string, string>; // employee -> voice_id override
  apiKey: string;
  account: ConduitAccount;
  dailyCharLimit: number;
  /** Chars already streamed today across prior calls. */
  charsUsedToday: number;
}

/**
 * Prepare a per-account TTS config for the chat route. Returns
 * `{ enabled: false }` if voice is off, the user is over the daily cap,
 * or upstream isn't configured. Cheap — single batched DB read.
 */
export async function prepareChatTts(
  supabase: SupabaseClient,
  account: ConduitAccount,
): Promise<ChatTtsConfig> {
  const apiKey = process.env.ELEVENLABS_API_KEY ?? "";
  const voiceEnabled = (account as ConduitAccount & { voice_enabled?: boolean }).voice_enabled === true;
  const voiceAutoPlay = (account as ConduitAccount & { voice_auto_play?: boolean }).voice_auto_play === true;
  const streamingTtsOn =
    (account as ConduitAccount & { streaming_tts_enabled?: boolean }).streaming_tts_enabled !== false;

  const baseConfig: ChatTtsConfig = {
    enabled: false,
    voicePrefs: {
      voice_enabled: voiceEnabled,
      voice_auto_play: voiceAutoPlay,
      voice_speed:
        (account as ConduitAccount & { voice_speed?: number }).voice_speed ??
        1.0,
    },
    voiceOverrides: {},
    apiKey,
    account,
    dailyCharLimit: DEFAULT_DAILY_CHAR_LIMIT,
    charsUsedToday: 0,
  };

  if (
    !apiKey ||
    !isVoiceConfigured() ||
    !voiceEnabled ||
    !voiceAutoPlay ||
    !streamingTtsOn
  ) {
    return baseConfig;
  }

  const [{ data: voicesRows }, { data: configRows }, { data: usageRows }] =
    await Promise.all([
      supabase
        .from("conduit_employee_voices")
        .select("employee, elevenlabs_voice_id")
        .eq("account_id", account.id),
      supabase
        .from("conduit_system_config")
        .select("value")
        .eq("key", "streaming_tts_daily_char_limit")
        .maybeSingle(),
      (() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return supabase
          .from("conduit_voice_chat_sessions")
          .select("characters_streamed")
          .eq("account_id", account.id)
          .gte("created_at", today.toISOString());
      })(),
    ]);

  const voiceOverrides: Record<string, string> = {};
  for (const row of (voicesRows ?? []) as Array<{ employee: string; elevenlabs_voice_id: string }>) {
    voiceOverrides[row.employee] = row.elevenlabs_voice_id;
  }
  const dailyLimit =
    parseInt((configRows?.value as string | undefined) ?? "", 10) ||
    DEFAULT_DAILY_CHAR_LIMIT;
  const charsUsed = (usageRows ?? []).reduce(
    (sum, r) =>
      sum + ((r.characters_streamed as number | null) ?? 0),
    0,
  );

  const overCap =
    !account.internal_account && charsUsed >= dailyLimit;

  return {
    ...baseConfig,
    enabled: !overCap,
    voiceOverrides,
    dailyCharLimit: dailyLimit,
    charsUsedToday: charsUsed,
  };
}

export function voiceForEmployee(
  cfg: ChatTtsConfig,
  employee: string,
): string {
  return cfg.voiceOverrides[employee] ?? defaultVoiceFor(employee);
}

export interface ChatTtsTurn {
  onDelta: (delta: string) => void;
  finish: () => Promise<{ chars: number; voice_id: string; first_audio_ms: number | null }>;
  cancel: () => void;
}

/**
 * Open a streaming TTS WS for one employee turn. Returns a turn handle
 * the chat route can drive from its token loop. Audio chunks fire as
 * SSE `audio` events via `sendAudio`; the chat route owns the SSE
 * controller, this module never touches it directly.
 */
export async function streamForEmployee(opts: {
  cfg: ChatTtsConfig;
  employee: string;
  sendAudio: (b64: string) => void;
}): Promise<ChatTtsTurn | null> {
  if (!opts.cfg.enabled) return null;
  const voiceId = voiceForEmployee(opts.cfg, opts.employee);
  const speed = opts.cfg.voicePrefs.voice_speed;
  const tts = new StreamingTts(voiceId, {
    speed,
    stability: 0.5,
    similarity: 0.75,
  });
  const segmenter = new SentenceSegmenter();
  const startedAt = Date.now();
  let firstAudioAt: number | null = null;
  let chars = 0;
  let active = true;

  tts.on("audio", (pcm) => {
    if (!active) return;
    if (firstAudioAt === null) firstAudioAt = Date.now();
    opts.sendAudio(pcm.toString("base64"));
  });
  tts.on("error", (err) => {
    console.error(`[chat-tts] ${opts.employee} tts error:`, err.message);
    active = false;
  });

  try {
    await tts.connect(opts.cfg.apiKey);
  } catch (err) {
    console.error(
      `[chat-tts] ${opts.employee} tts connect failed:`,
      (err as Error).message,
    );
    return null;
  }

  return {
    onDelta(delta: string) {
      if (!active) return;
      const sentences = segmenter.push(delta);
      for (const s of sentences) {
        if (!active) return;
        chars += s.length;
        tts.pushText(`${s} `);
      }
    },
    async finish() {
      if (!active) {
        return { chars, voice_id: voiceId, first_audio_ms: firstAudioAt ? firstAudioAt - startedAt : null };
      }
      const tail = segmenter.flush();
      if (tail) {
        chars += tail.length;
        tts.pushText(tail);
      }
      tts.end();
      // Give the WS a moment to drain final audio before the route returns.
      await new Promise((r) => setTimeout(r, 250));
      return {
        chars,
        voice_id: voiceId,
        first_audio_ms: firstAudioAt ? firstAudioAt - startedAt : null,
      };
    },
    cancel() {
      active = false;
      tts.abort();
    },
  };
}
