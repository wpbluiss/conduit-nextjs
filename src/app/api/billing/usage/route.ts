import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";

export const dynamic = "force-dynamic";

// Free tier monthly AI-message cap (responses from Praxis).
export const FREE_TIER_MSG_CAP = 10;

export async function GET() {
  const current = await getCurrentAccount();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { account } = current;

  const isFree = account.tier_id === "free" && !account.internal_account;
  const cap = isFree ? FREE_TIER_MSG_CAP : null;

  // Calendar-month reset — start of the current UTC month.
  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const period_end = nextMonth.toISOString().slice(0, 10);

  const supabase = await createSupabaseServerClient();

  // Fetch conversation IDs for this account.
  const { data: convRows } = await supabase
    .from("conduit_conversations")
    .select("id")
    .eq("account_id", account.id);

  const convIds = (convRows ?? []).map((r: { id: string }) => r.id);

  let used = 0;
  if (convIds.length > 0) {
    const { count } = await supabase
      .from("conduit_messages")
      .select("id", { count: "exact", head: true })
      .eq("role", "assistant")
      .gte("created_at", periodStart.toISOString())
      .in("conversation_id", convIds);
    used = count ?? 0;
  }

  return NextResponse.json({ used, cap, period_end, isFree });
}
