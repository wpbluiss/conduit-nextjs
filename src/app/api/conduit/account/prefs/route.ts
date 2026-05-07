import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

const TZ_RE = /^[A-Za-z]+(?:\/[A-Za-z_]+){1,3}$/;

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: {
    timezone?: string;
    notify_voice_room_ready?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.timezone !== undefined) {
    const tz = body.timezone.trim();
    if (!tz || !TZ_RE.test(tz)) {
      return NextResponse.json(
        { error: "invalid_timezone" },
        { status: 400 },
      );
    }
    update.timezone = tz;
  }
  if (typeof body.notify_voice_room_ready === "boolean") {
    update.notify_voice_room_ready = body.notify_voice_room_ready;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no_op" }, { status: 400 });
  }
  update.updated_at = new Date().toISOString();

  const account = await getOrCreateAccount(supabase, user);
  const { error } = await supabase
    .from("conduit_accounts")
    .update(update)
    .eq("id", account.id);
  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
