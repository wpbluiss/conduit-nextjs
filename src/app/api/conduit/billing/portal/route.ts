import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { getStripe, isBillingConfigured } from "@/lib/billing/stripe";

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

  const account = await getOrCreateAccount(supabase, user);
  if (account.internal_account) {
    return NextResponse.json(
      { error: "internal_account" },
      { status: 403 },
    );
  }
  if (!account.stripe_customer_id) {
    return NextResponse.json(
      { error: "no_customer" },
      { status: 400 },
    );
  }

  let returnUrl: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    returnUrl = body?.return_url;
  } catch {
    /* ignore */
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: account.stripe_customer_id,
    return_url: returnUrl || `${request.nextUrl.origin}/app/settings`,
  });
  return NextResponse.json({ url: session.url });
}
