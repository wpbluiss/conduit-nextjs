import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { getStripe, isBillingConfigured } from "@/lib/billing/stripe";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isBillingConfigured()) {
    return NextResponse.json({ error: "billing_not_configured" }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const account = await getOrCreateAccount(supabase, user);
  if (account.internal_account) {
    return NextResponse.json({ error: "internal_account" }, { status: 403 });
  }
  if (!account.stripe_subscription_id) {
    return NextResponse.json({ error: "no_subscription" }, { status: 400 });
  }

  let action: "cancel" | "reactivate" = "cancel";
  try {
    const body = await request.json().catch(() => ({}));
    if (body?.action === "reactivate") action = "reactivate";
  } catch { /* ignore */ }

  const stripe = getStripe();
  const cancelAtPeriodEnd = action === "cancel";
  const sub = await stripe.subscriptions.update(account.stripe_subscription_id, {
    cancel_at_period_end: cancelAtPeriodEnd,
  });

  return NextResponse.json({
    ok: true,
    cancel_at_period_end: sub.cancel_at_period_end,
    cancel_at: sub.cancel_at,
  });
}
