// GET /api/engineering/sessions — list this account's engineering builds.
// Drives the "Engineering Builds" tab on /app/builds.

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const account = await getOrCreateAccount(supabase, user);

  const { data, error } = await supabase
    .from("conduit_engineering_sessions")
    .select(
      "id, prompt, build_type, status, deploy_url, github_repo, total_input_tokens, total_output_tokens, error_message, started_at, completed_at, created_at",
    )
    .eq("account_id", account.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { error: "list_failed", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ sessions: data ?? [] });
}
