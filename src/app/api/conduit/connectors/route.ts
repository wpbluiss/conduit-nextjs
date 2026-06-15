import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";
import { isGoogleCalendarConfigured } from "@/lib/connectors/google-calendar";
import { isSlackConfigured } from "@/lib/connectors/slack";
import { isHubSpotConfigured } from "@/lib/connectors/hubspot";
import { isGoogleDriveConfigured } from "@/lib/connectors/google-drive";
import { isGithubOAuthConfigured } from "@/lib/connectors/github";

export const runtime = "nodejs";

export interface ConnectorStat {
  provider: string;
  fetch_count: number;
  last_fetched_at: string | null;
  connected_since: string;
}

// GET /api/conduit/connectors
// Returns which providers are connected for the current account,
// plus which ones are available (env vars configured) and usage stats.
export async function GET() {
  const current = await getCurrentAccount();
  if (!current) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { account } = current;
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("conduit_connector_tokens")
    .select("provider, fetch_count, last_fetched_at, created_at")
    .eq("account_id", account.id);

  const rows = (data ?? []) as Array<{
    provider: string;
    fetch_count: number;
    last_fetched_at: string | null;
    created_at: string;
  }>;

  const connected = rows.map((r) => r.provider);
  const stats: ConnectorStat[] = rows.map((r) => ({
    provider: r.provider,
    fetch_count: r.fetch_count ?? 0,
    last_fetched_at: r.last_fetched_at ?? null,
    connected_since: r.created_at,
  }));

  return NextResponse.json({
    connected,
    stats,
    available: {
      google_calendar: isGoogleCalendarConfigured(),
      slack: isSlackConfigured(),
      hubspot: isHubSpotConfigured(),
      github: isGithubOAuthConfigured(),
      google_drive: isGoogleDriveConfigured(),
    },
  });
}
