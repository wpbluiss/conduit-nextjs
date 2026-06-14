import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024; // Whisper limit is 25 MB

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "transcription_unavailable", message: "Whisper is not configured on this deployment." },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const audio = formData.get("audio");
  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: "missing_audio" }, { status: 400 });
  }
  if (audio.size === 0) {
    return NextResponse.json({ error: "empty_audio" }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }

  const whisperForm = new FormData();
  whisperForm.append("file", audio, "audio.webm");
  whisperForm.append("model", "whisper-1");
  whisperForm.append("response_format", "json");

  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";

  let transcript: string;
  try {
    const resp = await fetch(`${baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: whisperForm,
    });

    if (!resp.ok) {
      const err = await resp.text().catch(() => "");
      console.error("[transcribe] Whisper error", resp.status, err);
      return NextResponse.json(
        { error: "transcription_failed", message: "Could not transcribe audio." },
        { status: 502 },
      );
    }

    const json = (await resp.json()) as { text?: string };
    transcript = (json.text ?? "").trim();
  } catch (err) {
    console.error("[transcribe] fetch failed", err);
    return NextResponse.json(
      { error: "transcription_failed", message: "Could not reach transcription service." },
      { status: 502 },
    );
  }

  return NextResponse.json({ transcript });
}
