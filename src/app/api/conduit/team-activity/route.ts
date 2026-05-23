import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";
import { getTeamActivityBundle } from "@/lib/conduit/team-activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Per-employee team-activity bundle for the workspace dashboard's
 * polling refresh (~60s cadence, visibility-gated). RLS-scoped via
 * the standard server client; 401 when unauthenticated.
 *
 * Contract: data-model.md §6 / R-002. Reads existing conduit_* tables
 * only; no schema changes.
 *
 * GET defaults to uncached in App Router (verified against
 * node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md),
 * which is what we want — the response is account-scoped + time-fresh.
 */
export async function GET() {
  const current = await getCurrentAccount();
  if (!current) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = await createSupabaseServerClient();
  const bundle = await getTeamActivityBundle(supabase, current.account.id);
  return NextResponse.json(bundle);
}
