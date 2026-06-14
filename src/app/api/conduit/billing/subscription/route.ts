import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { getStripe, isBillingConfigured } from "@/lib/billing/stripe";

export const runtime = "nodejs";

export async function GET() {
  if (!isBillingConfigured()) {
    return NextResponse.json({ subscription: null });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const account = await getOrCreateAccount(supabase, user);
  if (!account.stripe_subscription_id) {
    return NextResponse.json({ subscription: null });
  }

  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(account.stripe_subscription_id);

  return NextResponse.json({
    subscription: {
      id: sub.id,
      status: sub.status,
      cancel_at_period_end: sub.cancel_at_period_end,
      cancel_at: sub.cancel_at,
    },
  });
}
