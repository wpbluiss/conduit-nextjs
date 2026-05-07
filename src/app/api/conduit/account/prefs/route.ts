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

  let body: { timezone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const tz = body.timezone?.trim();
  if (!tz || !TZ_RE.test(tz)) {
    return NextResponse.json(
      { error: "invalid_timezone" },
      { status: 400 },
    );
  }

  const account = await getOrCreateAccount(supabase, user);
  const { error } = await supabase
    .from("conduit_accounts")
    .update({ timezone: tz, updated_at: new Date().toISOString() })
    .eq("id", account.id);
  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
