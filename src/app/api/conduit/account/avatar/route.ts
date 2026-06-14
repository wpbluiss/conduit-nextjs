import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
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

  const file = formData.get("avatar");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  }

  const account = await getOrCreateAccount(supabase, user);

  const ext = file.type.split("/")[1] ?? "jpg";
  const storagePath = `avatars/${account.id}/avatar.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const admin = createSupabaseAdminClient();
  const { error: uploadErr } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: true });

  if (uploadErr) {
    console.error("avatar upload error", uploadErr);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }

  const { data: publicData } = admin.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  const avatarUrl = publicData.publicUrl;

  const { error: dbErr } = await supabase
    .from("conduit_accounts")
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("id", account.id);

  if (dbErr) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ avatar_url: avatarUrl });
}
