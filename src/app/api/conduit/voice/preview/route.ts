import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { isVoiceConfigured, streamTTS } from "@/lib/voice/tts";
import { previewLineFor } from "@/lib/voice/defaults";
import type { EmployeeKey } from "@/lib/ai/provider";

export const runtime = "nodejs";

// In-memory preview cache keyed by voice_id+employee. Caches the audio
// bytes for 24h so previewing a voice doesn't re-bill ElevenLabs every click.
const previewCache = new Map<
  string,
  { bytes: ArrayBuffer; fetched: number }
>();
const TTL_MS = 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  if (!isVoiceConfigured()) {
    return NextResponse.json(
      { error: "voice_not_configured" },
      { status: 503 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { voice_id?: string; employee?: EmployeeKey };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const voiceId = body.voice_id;
  const employee = body.employee ?? "jarvis";
  if (!voiceId) {
    return NextResponse.json({ error: "missing_voice_id" }, { status: 400 });
  }

  const account = await getOrCreateAccount(supabase, user);
  if (!account.internal_account && account.tier_id === "free") {
    return NextResponse.json(
      { error: "voice_locked" },
      { status: 403 },
    );
  }

  const key = `${voiceId}:${employee}`;
  const cached = previewCache.get(key);
  if (cached && Date.now() - cached.fetched < TTL_MS) {
    return new Response(cached.bytes, {
      status: 200,
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  }

  const text = previewLineFor(employee);
  let upstream: Response;
  try {
    upstream = await streamTTS({ text, voiceId, speed: 1.0 });
  } catch (err) {
    const e = err as { status?: number; body?: string; message?: string };
    console.error("voice_preview upstream error", {
      voiceId,
      status: e.status,
      body: e.body?.slice(0, 200),
      message: e.message,
    });
    if (e.status === 404 || e.status === 400) {
      return NextResponse.json(
        {
          error: "voice_unavailable",
          message:
            "Preview unavailable for this voice. It still works in chat — pick a different voice or just hit send.",
        },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "tts_failed", message: "Preview unavailable. Try again." },
      { status: 502 },
    );
  }

  const buf = await upstream.arrayBuffer();
  previewCache.set(key, { bytes: buf, fetched: Date.now() });
  if (previewCache.size > 200) {
    const oldest = previewCache.keys().next().value;
    if (oldest) previewCache.delete(oldest);
  }

  return new Response(buf, {
    status: 200,
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
  });
}
