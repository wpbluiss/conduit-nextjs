import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { isVoiceConfigured, streamTTS } from "@/lib/voice/tts";
import { defaultVoiceFor } from "@/lib/voice/defaults";
import { voiceCostCentsForChars } from "@/lib/voice/pricing";
import type { EmployeeKey } from "@/lib/ai/provider";

export const runtime = "nodejs";

const FREE_TIER_GATED = ["free"];

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

  let body: { text?: string; employee?: EmployeeKey };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const text = (body.text ?? "").trim();
  const employee = body.employee ?? "jarvis";
  if (!text) {
    return NextResponse.json({ error: "empty_text" }, { status: 400 });
  }
  if (text.length > 4000) {
    return NextResponse.json({ error: "text_too_long" }, { status: 413 });
  }

  const account = await getOrCreateAccount(supabase, user);

  // Tier gate
  if (
    !account.internal_account &&
    FREE_TIER_GATED.includes(account.tier_id)
  ) {
    return NextResponse.json(
      {
        error: "voice_locked",
        message: "Upgrade to Pro to hear your team.",
      },
      { status: 403 },
    );
  }

  // Resolve voice
  const { data: override } = await supabase
    .from("conduit_employee_voices")
    .select("elevenlabs_voice_id")
    .eq("account_id", account.id)
    .eq("employee", employee)
    .maybeSingle();
  const voiceId =
    (override?.elevenlabs_voice_id as string | undefined) ??
    defaultVoiceFor(employee);

  let upstream: Response;
  try {
    upstream = await streamTTS({
      text,
      voiceId,
      speed: account.voice_speed ?? 1.0,
    });
  } catch {
    return NextResponse.json(
      { error: "tts_failed" },
      { status: 502 },
    );
  }

  // Log usage (fire-and-forget)
  void supabase.from("conduit_usage_events").insert({
    account_id: account.id,
    employee,
    provider: "elevenlabs",
    model: "eleven_turbo_v2_5",
    input_tokens: 0,
    output_tokens: 0,
    estimated_cost_cents: voiceCostCentsForChars(text.length),
    metadata: {
      voice: {
        provider: "elevenlabs",
        characters: text.length,
        voice_id: voiceId,
      },
    },
  });

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
