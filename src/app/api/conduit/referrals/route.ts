import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

// GET /api/conduit/referrals — return my referral code + referral stats
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const account = await getOrCreateAccount(supabase, user);

  const { data: referrals } = await supabase
    .from("conduit_referrals")
    .select("id, tokens_granted, created_at")
    .eq("referrer_account_id", account.id)
    .order("created_at", { ascending: false });

  const totalEarned = (referrals ?? []).reduce(
    (sum, r) => sum + (r.tokens_granted as number),
    0,
  );

  return NextResponse.json({
    referral_code: (account as { referral_code?: string | null }).referral_code ?? null,
    referrals: referrals ?? [],
    total_earned: totalEarned,
    referral_count: (referrals ?? []).length,
  });
}
