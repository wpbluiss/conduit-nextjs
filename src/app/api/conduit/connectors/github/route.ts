import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";
import { validateGithubPat, getGithubToken } from "@/lib/connectors/github";

export const runtime = "nodejs";

// GET /api/conduit/connectors/github
// Returns current connection status + configured repos.
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

// POST /api/conduit/connectors/github
// Save GitHub PAT + list of repos. Validates the PAT before storing.
export async function POST(request: NextRequest) {
  const current = await getCurrentAccount();
  if (!current) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { account } = current;

  const body = (await request.json()) as { pat?: string; repos?: string[] };
  const pat = (body.pat ?? "").trim();
  const repos = (body.repos ?? []).map((r: string) => r.trim()).filter(Boolean).slice(0, 5);

  if (!pat) return NextResponse.json({ error: "pat_required" }, { status: 400 });

  // Validate PAT against GitHub API.
  const user = await validateGithubPat(pat);
  if (!user) return NextResponse.json({ error: "invalid_pat" }, { status: 422 });

  const supabase = await createSupabaseServerClient();
  const { error: dbError } = await supabase
    .from("conduit_connector_tokens")
    .upsert(
      {
        account_id: account.id,
        provider: "github",
        access_token: pat,
        refresh_token: null,
        expires_at: null,
        scope: "repo:read",
        meta: { repos, github_login: user.login },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "account_id,provider" },
    );

  if (dbError) return NextResponse.json({ error: "db_error" }, { status: 500 });

  return NextResponse.json({ connected: true, login: user.login, repos });
}

// PATCH /api/conduit/connectors/github
// Update repos list only (does not re-validate PAT).
export async function PATCH(request: NextRequest) {
  const current = await getCurrentAccount();
  if (!current) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { account } = current;

  const body = (await request.json()) as { repos?: string[] };
  const repos = (body.repos ?? []).map((r: string) => r.trim()).filter(Boolean).slice(0, 5);

  const supabase = await createSupabaseServerClient();
  const token = await getGithubToken(supabase, account.id);
  if (!token) return NextResponse.json({ error: "not_connected" }, { status: 404 });

  const existingMeta = token.meta as Record<string, unknown>;
  const { error: dbError } = await supabase
    .from("conduit_connector_tokens")
    .update({
      meta: { ...existingMeta, repos },
      updated_at: new Date().toISOString(),
    })
    .eq("account_id", account.id)
    .eq("provider", "github");

  if (dbError) return NextResponse.json({ error: "db_error" }, { status: 500 });

  return NextResponse.json({ repos });
}

// DELETE /api/conduit/connectors/github
// Remove stored PAT and disconnect GitHub.
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
