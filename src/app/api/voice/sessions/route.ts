import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const account = await getOrCreateAccount(supabase, user);
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get("limit") ?? "50", 10) || 50,
    200,
  );

  const { data, error } = await supabase
    .from("conduit_voice_sessions")
    .select(
      "id, employee_id, room_name, started_at, ended_at, duration_seconds, end_reason, transcript_summary, raw_transcript, total_input_ms, total_output_ms, created_at",
    )
    .eq("account_id", account.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ sessions: data ?? [] });
}
