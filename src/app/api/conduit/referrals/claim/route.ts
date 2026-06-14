import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

const REFERRAL_TOKENS = 50;

// POST /api/conduit/referrals/claim
// Body: { code: string }
// Credits both the referrer and the current (referee) account with bonus tokens.
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const code = (body.code ?? "").trim().toUpperCase();
  if (!code || code.length !== 8) {
    return NextResponse.json({ error: "invalid_code" }, { status: 400 });
  }

  const refereeAccount = await getOrCreateAccount(supabase, user);

  // Check if this account has already claimed a referral (one per account)
  const { count: alreadyClaimed } = await supabase
    .from("conduit_referrals")
    .select("id", { count: "exact", head: true })
    .eq("referee_account_id", refereeAccount.id);

  if ((alreadyClaimed ?? 0) > 0) {
    return NextResponse.json({ error: "already_claimed" }, { status: 409 });
  }

  // Look up the referrer by code — use admin client to bypass RLS
  const admin = createSupabaseAdminClient();
  const { data: referrerAccount } = await admin
    .from("conduit_accounts")
    .select("id, bonus_tokens")
    .eq("referral_code", code)
    .maybeSingle();

  if (!referrerAccount) {
    return NextResponse.json({ error: "invalid_code" }, { status: 400 });
  }

  // Prevent self-referral
  if (referrerAccount.id === refereeAccount.id) {
    return NextResponse.json({ error: "self_referral" }, { status: 400 });
  }

  // Record the referral (unique constraint on referee_account_id prevents duplicates)
  const { error: insertError } = await admin.from("conduit_referrals").insert({
    referrer_account_id: referrerAccount.id,
    referee_account_id: refereeAccount.id,
    code,
    tokens_granted: REFERRAL_TOKENS,
  });

  if (insertError) {
    // Unique constraint violation = already claimed (race condition)
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "already_claimed" }, { status: 409 });
    }
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  // Credit both accounts
  await Promise.all([
    admin
      .from("conduit_accounts")
      .update({
        bonus_tokens: (referrerAccount.bonus_tokens as number ?? 0) + REFERRAL_TOKENS,
      })
      .eq("id", referrerAccount.id),
    admin
      .from("conduit_accounts")
      .update({
        bonus_tokens: (refereeAccount.bonus_tokens ?? 0) + REFERRAL_TOKENS,
      })
      .eq("id", refereeAccount.id),
  ]);

  return NextResponse.json({ ok: true, tokens_granted: REFERRAL_TOKENS });
}
