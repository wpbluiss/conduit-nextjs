import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

// Max 10 MB per voice message.
const MAX_BYTES = 10 * 1024 * 1024;

// Signed URL valid for 24 hours — long enough for the session; the message
// is persisted in the DB so the user can always re-fetch a fresh URL later.
const SIGNED_URL_EXPIRES_IN = 60 * 60 * 24;

const BUCKET = "conduit";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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
  if (audio.size > MAX_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }
  if (audio.size === 0) {
    return NextResponse.json({ error: "empty_audio" }, { status: 400 });
  }

  const conversationIdParam = formData.get("conversation_id");
  const mimeType = (formData.get("mime_type") as string | null) ?? "audio/webm";

  const account = await getOrCreateAccount(supabase, user);

  // Get or create a conversation to attach the message to.
  let conversationId: string;
  if (typeof conversationIdParam === "string" && conversationIdParam.trim()) {
    conversationId = conversationIdParam.trim();
  } else {
    const { data: conv, error: convErr } = await supabase
      .from("conduit_conversations")
      .insert({ account_id: account.id, title: "Voice conversation" })
      .select("id")
      .single();
    if (convErr || !conv) {
      return NextResponse.json({ error: "conversation_create_failed" }, { status: 500 });
    }
    conversationId = conv.id;
  }

  // Build a storage path that's scoped to the account and conversation.
  const ext = mimeType.startsWith("audio/ogg") ? "ogg" : mimeType.startsWith("audio/mp4") ? "mp4" : "webm";
  const timestamp = Date.now();
  const storagePath = `voice/${account.id}/${conversationId}/${timestamp}.${ext}`;

  const admin = createSupabaseAdminClient();
  const arrayBuffer = await audio.arrayBuffer();
  const { error: uploadErr } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, { contentType: mimeType, upsert: false });

  if (uploadErr) {
    console.error("voice upload error", uploadErr);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }

  // Generate a signed URL so the client can play back the audio.
  const { data: signedData, error: signErr } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRES_IN);

  if (signErr || !signedData?.signedUrl) {
    console.error("voice sign error", signErr);
    return NextResponse.json({ error: "sign_failed" }, { status: 500 });
  }

  const url = signedData.signedUrl;

  const { data: msg, error: msgErr } = await supabase
    .from("conduit_messages")
    .insert({
      conversation_id: conversationId,
      role: "user",
      content: "[Voice message]",
      metadata: {
        type: "voice",
        attachment_url: url,
        storage_path: storagePath,
        mime_type: mimeType,
      },
    })
    .select("id, metadata, created_at")
    .single();

  if (msgErr || !msg) {
    console.error("voice message insert error", msgErr);
    return NextResponse.json({ error: "message_insert_failed" }, { status: 500 });
  }

  return NextResponse.json({
    message_id: msg.id,
    conversation_id: conversationId,
    url,
  });
}
