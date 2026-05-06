import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

const VALID_EMPLOYEES = ["jarvis", "marketing", "sales", "engineering"];

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const account = await getOrCreateAccount(supabase, user);
  const { data: voices } = await supabase
    .from("conduit_employee_voices")
    .select("employee, elevenlabs_voice_id")
    .eq("account_id", account.id);

  return NextResponse.json({
    voice_enabled: account.voice_enabled,
    voice_auto_play: account.voice_auto_play,
    voice_speed: Number(account.voice_speed),
    employee_voices: Object.fromEntries(
      (voices ?? []).map((v) => [v.employee, v.elevenlabs_voice_id]),
    ),
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: {
    voice_enabled?: boolean;
    voice_auto_play?: boolean;
    voice_speed?: number;
    employee_voices?: Record<string, string>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const account = await getOrCreateAccount(supabase, user);

  const accountUpdate: Record<string, unknown> = {};
  if (typeof body.voice_enabled === "boolean")
    accountUpdate.voice_enabled = body.voice_enabled;
  if (typeof body.voice_auto_play === "boolean")
    accountUpdate.voice_auto_play = body.voice_auto_play;
  if (typeof body.voice_speed === "number") {
    const s = Math.max(0.5, Math.min(2.0, body.voice_speed));
    accountUpdate.voice_speed = s;
  }
  if (Object.keys(accountUpdate).length) {
    await supabase
      .from("conduit_accounts")
      .update(accountUpdate)
      .eq("id", account.id);
  }

  if (body.employee_voices) {
    const rows = Object.entries(body.employee_voices)
      .filter(([emp]) => VALID_EMPLOYEES.includes(emp))
      .filter(([, vid]) => typeof vid === "string" && vid.length > 0)
      .map(([employee, elevenlabs_voice_id]) => ({
        account_id: account.id,
        employee,
        elevenlabs_voice_id,
      }));
    if (rows.length) {
      await supabase
        .from("conduit_employee_voices")
        .upsert(rows, { onConflict: "account_id,employee" });
    }
  }

  return NextResponse.json({ ok: true });
}
