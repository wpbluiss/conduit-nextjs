import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!stripe || !WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, note: "billing not configured" }, { status: 200 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "bad signature";
    return NextResponse.json({ error: `Webhook: ${msg}` }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  async function setPlanByCustomer(customerId: string, patch: Record<string, unknown>) {
    await admin.from("fin_household").update(patch).eq("stripe_customer_id", customerId);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const hh = s.client_reference_id || (s.metadata?.household_id as string | undefined);
        const customerId = (s.customer as string) ?? null;
        const patch: Record<string, unknown> = {
          plan: "plus",
          plan_status: "active",
          stripe_subscription_id: (s.subscription as string) ?? null,
        };
        if (customerId) patch.stripe_customer_id = customerId;
        if (hh) await admin.from("fin_household").update(patch).eq("id", hh);
        else if (customerId) await setPlanByCustomer(customerId, patch);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        const active = ["active", "trialing"].includes(sub.status);
        await setPlanByCustomer(sub.customer as string, {
          plan: active ? "plus" : "free",
          plan_status: sub.status,
          stripe_subscription_id: sub.id,
          current_period_end: sub.items.data[0]?.current_period_end
            ? new Date(sub.items.data[0].current_period_end * 1000).toISOString()
            : null,
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await setPlanByCustomer(sub.customer as string, { plan: "free", plan_status: "canceled" });
        break;
      }
    }
  } catch {
    // swallow — Stripe will retry on non-2xx; we return 200 to avoid storms once handled
  }

  return NextResponse.json({ received: true });
}
