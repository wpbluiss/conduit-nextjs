import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchVoices, isVoiceConfigured } from "@/lib/voice/tts";
import { DEFAULT_EMPLOYEE_VOICES, VOICE_NAMES } from "@/lib/voice/defaults";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isVoiceConfigured()) {
    // Static fallback list so the Settings UI can still show defaults.
    const voices = Object.values(DEFAULT_EMPLOYEE_VOICES).map((id) => ({
      voice_id: id,
      name: VOICE_NAMES[id] ?? id,
    }));
    return NextResponse.json({ voices, configured: false });
  }

  const voices = await fetchVoices();
  return NextResponse.json({ voices, configured: true });
}
