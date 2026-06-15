import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";
import { getGithubToken } from "@/lib/connectors/github";

export const runtime = "nodejs";

// GET /api/conduit/connectors/github
// Returns current connection status, login, and auto-selected repos.
export async function GET() {
  const current = await getCurrentAccount();
  if (!current) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { account } = current;
  const supabase = await createSupabaseServerClient();

  const token = await getGithubToken(supabase, account.id);
  if (!token) return NextResponse.json({ connected: false });

  const meta = token.meta as { repos?: string[]; github_login?: string } | null;
  return NextResponse.json({
    connected: true,
    repos: meta?.repos ?? [],
    login: meta?.github_login ?? null,
    last_fetched_at: token.last_fetched_at,
    fetch_count: token.fetch_count,
  });
}

// DELETE /api/conduit/connectors/github
// Remove stored token and disconnect GitHub.
export async function DELETE() {
  const current = await getCurrentAccount();
  if (!current) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { account } = current;
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("conduit_connector_tokens")
    .delete()
    .eq("account_id", account.id)
    .eq("provider", "github");

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  return NextResponse.json({ disconnected: true });
}
