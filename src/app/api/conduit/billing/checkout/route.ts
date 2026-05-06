import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { getStripe, isBillingConfigured } from "@/lib/billing/stripe";
import { TIERS, TOPUPS, type TierId } from "@/lib/billing/tiers";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isBillingConfigured()) {
    return NextResponse.json(
      { error: "billing_not_configured" },
      { status: 503 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: {
    tier_id?: TierId;
    topup_id?: string;
    return_url?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const account = await getOrCreateAccount(supabase, user);
  if (account.internal_account) {
    return NextResponse.json(
      { error: "internal_account" },
      { status: 403 },
    );
  }

  const stripe = getStripe();

  // Get-or-create Stripe customer
  let customerId = account.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: {
        account_id: account.id,
        owner_user_id: user.id,
      },
    });
    customerId = customer.id;
    await supabase
      .from("conduit_accounts")
      .update({ stripe_customer_id: customerId })
      .eq("id", account.id);
  }

  const returnUrl =
    body.return_url ||
    `${request.nextUrl.origin}/app/settings`;

  // Subscription path
  if (body.tier_id) {
    const tier = TIERS[body.tier_id];
    if (!tier || tier.id === "free") {
      return NextResponse.json(
        { error: "invalid_tier" },
        { status: 400 },
      );
    }
    const priceId = tier.stripePriceIdEnv
      ? process.env[tier.stripePriceIdEnv]
      : undefined;
    if (!priceId) {
      return NextResponse.json(
        { error: "tier_price_not_configured" },
        { status: 503 },
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${returnUrl}?checkout=success`,
      cancel_url: `${returnUrl}?checkout=canceled`,
      metadata: {
        account_id: account.id,
        tier_id: tier.id,
      },
      subscription_data: {
        metadata: {
          account_id: account.id,
          tier_id: tier.id,
        },
      },
    });
    return NextResponse.json({ url: session.url });
  }

  // Top-up path
  if (body.topup_id) {
    const topup = TOPUPS.find((t) => t.id === body.topup_id);
    if (!topup) {
      return NextResponse.json({ error: "invalid_topup" }, { status: 400 });
    }
    const priceId = process.env[topup.stripePriceIdEnv];
    if (!priceId) {
      return NextResponse.json(
        { error: "topup_price_not_configured" },
        { status: 503 },
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${returnUrl}?topup=success`,
      cancel_url: `${returnUrl}?topup=canceled`,
      metadata: {
        account_id: account.id,
        topup_id: topup.id,
        tokens_granted: String(topup.tokensGranted),
      },
      payment_intent_data: {
        metadata: {
          account_id: account.id,
          topup_id: topup.id,
          tokens_granted: String(topup.tokensGranted),
        },
      },
    });
    return NextResponse.json({ url: session.url });
  }

  return NextResponse.json({ error: "missing_target" }, { status: 400 });
}
