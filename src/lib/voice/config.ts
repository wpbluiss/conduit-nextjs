// Reads voice ceilings from conduit_system_config. Falls back to spec
// defaults if the row is missing so the route never hard-fails on config.

import type { SupabaseClient } from "@supabase/supabase-js";

export interface VoiceCeilings {
  maxSeconds: number;
  warnSeconds: number;
  dailyMinutes: number;
}

const DEFAULTS: VoiceCeilings = {
  maxSeconds: 300,
  warnSeconds: 240,
  dailyMinutes: 30,
};

export async function readVoiceCeilings(
  supabase: SupabaseClient,
): Promise<VoiceCeilings> {
  const { data } = await supabase
    .from("conduit_system_config")
    .select("key, value")
    .in("key", [
      "voice_session_max_seconds",
      "voice_session_warn_seconds",
      "voice_daily_minutes_per_account",
    ]);
  const map = new Map<string, string>(
    (data ?? []).map((r) => [r.key as string, r.value as string]),
  );
  const num = (k: string, d: number) =>
    map.has(k) ? parseInt(map.get(k)!, 10) || d : d;
  return {
    maxSeconds: num("voice_session_max_seconds", DEFAULTS.maxSeconds),
    warnSeconds: num("voice_session_warn_seconds", DEFAULTS.warnSeconds),
    dailyMinutes: num("voice_daily_minutes_per_account", DEFAULTS.dailyMinutes),
  };
}

/**
 * Resolve which ElevenLabs voice_id should drive an employee for an account.
 *
 *   1. per-account override (R5 conduit_employee_voices)
 *   2. global default (conduit_employee_default_voices)
 *   3. Atlas fallback (employee id "jarvis" in default_voices — preserved
 *      enum value for the Chief of Staff)
 *
 * voice_id may still be null at the end if Atlas hasn't been configured —
 * the worker handles that by emitting a baked-in fallback ElevenLabs voice
 * id from worker env (FALLBACK_ELEVENLABS_VOICE_ID).
 */
export async function resolveVoiceId(
  supabase: SupabaseClient,
  accountId: string,
  employee: string,
): Promise<{ voice_id: string | null; voice_locale: string }> {
  const { data: override } = await supabase
    .from("conduit_employee_voices")
    .select("elevenlabs_voice_id")
    .eq("account_id", accountId)
    .eq("employee", employee)
    .maybeSingle();
  if (override?.elevenlabs_voice_id) {
    return {
      voice_id: override.elevenlabs_voice_id as string,
      voice_locale: "en-US",
    };
  }

  const { data: def } = await supabase
    .from("conduit_employee_default_voices")
    .select("voice_id, voice_locale")
    .eq("employee", employee)
    .maybeSingle();
  if (def?.voice_id) {
    return {
      voice_id: def.voice_id as string,
      voice_locale: (def.voice_locale as string) ?? "en-US",
    };
  }

  const { data: jarvis } = await supabase
    .from("conduit_employee_default_voices")
    .select("voice_id, voice_locale")
    .eq("employee", "jarvis")
    .maybeSingle();
  return {
    voice_id: (jarvis?.voice_id as string | null) ?? null,
    voice_locale: (jarvis?.voice_locale as string) ?? "en-US",
  };
}
