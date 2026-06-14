import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";
import { getConnectedProviders, isGoogleCalendarConfigured } from "@/lib/connectors/google-calendar";
import { isSlackConfigured } from "@/lib/connectors/slack";
import { isNotionConfigured } from "@/lib/connectors/notion";

export const runtime = "nodejs";

// GET /api/conduit/connectors
// Returns which providers are connected for the current account,
// plus which ones are available (env vars configured).
export async function GET() {
  const current = await getCurrentAccount();
  if (!current) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { account } = current;
  const supabase = await createSupabaseServerClient();

  const connected = await getConnectedProviders(supabase, account.id);

  return NextResponse.json({
    connected,
    available: {
      google_calendar: isGoogleCalendarConfigured(),
      slack: isSlackConfigured(),
      notion: isNotionConfigured(),
    },
  });
}
