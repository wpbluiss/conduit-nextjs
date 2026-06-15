import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const BUCKET = "conduit";
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const account = await getOrCreateAccount(supabase, user);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form_data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "file_too_large" }, { status: 400 });
  }

  const type = file.type.split(";")[0].trim().toLowerCase();
  if (!ALLOWED_TYPES.includes(type)) {
    return NextResponse.json({ error: "invalid_file_type" }, { status: 400 });
  }

  const ext = type === "image/jpeg" ? "jpg" : "png";
  const path = `workspace-logos/${account.id}/logo.${ext}`;

  const admin = createSupabaseAdminClient();
  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, {
      contentType: type,
      upsert: true,
    });

  if (uploadError) {
    console.error("[workspace/logo] upload error:", uploadError);
    return NextResponse.json(
      { error: "upload_failed", detail: uploadError.message },
      { status: 500 },
    );
  }

  const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path);
  const logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  const { error: dbError } = await supabase
    .from("conduit_accounts")
    .update({ avatar_url: logoUrl, updated_at: new Date().toISOString() })
    .eq("id", account.id);

  if (dbError) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ avatar_url: logoUrl });
}
