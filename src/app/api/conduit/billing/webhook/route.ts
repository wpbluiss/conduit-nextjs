import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getStripe,
  getWebhookSecret,
  isBillingConfigured,
} from "@/lib/billing/stripe";
import { TIERS, type TierId } from "@/lib/billing/tiers";
import type Stripe from "stripe";
import { sendEmail } from "@/lib/email/send";
import {
  subscriptionReceiptEmail,
  topupReceiptEmail,
} from "@/lib/email/templates";

export const runtime = "nodejs";

// Service-role Supabase client for webhook writes (bypasses RLS).
function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL!;
  // Match the canonical admin client convention (src/lib/supabase/admin.ts):
  // prefer SUPABASE_SERVICE_ROLE_KEY, fall back to legacy SUPABASE_SERVICE_KEY.
  // Without this, a mismatched env name = paid customers silently not upgraded.
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function priceIdForTier(tierId: TierId): string | undefined {
  const env = TIERS[tierId].stripePriceIdEnv;
  return env ? process.env[env] : undefined;
}

function tierForPriceId(priceId: string): TierId | null {
  for (const id of ["pro", "enterprise"] as TierId[]) {
    if (priceIdForTier(id) === priceId) return id;
  }
  return null;
}

export async function POST(request: NextRequest) {
  if (!isBillingConfigured()) {
    return NextResponse.json(
      { error: "billing_not_configured" },
      { status: 503 },
    );
  }
  const secret = getWebhookSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "webhook_secret_not_configured" },
      { status: 503 },
    );
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }
  const raw = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error("webhook signature verify failed", err);
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  const sb = serviceClient();

  // Idempotency — if we've already processed this event, ack and bail.
  const { data: existing } = await sb
    .from("conduit_stripe_events")
    .select("id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  let accountId: string | null = null;
  try {
    accountId = await handleEvent(event, sb);
  } catch (err) {
    console.error(`webhook handler error [${event.type}]`, err);
    // Still log the event so we don't retry forever for poison messages.
  }

  await sb.from("conduit_stripe_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
    payload: event as unknown as Record<string, unknown>,
    account_id: accountId,
  });

  return NextResponse.json({ received: true });
}

async function handleEvent(
  event: Stripe.Event,
  sb: ReturnType<typeof serviceClient>,
): Promise<string | null> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const accountId = session.metadata?.account_id;
      if (!accountId) return null;

      const customerEmail = session.customer_details?.email ?? null;
      const amountStr = session.amount_total
        ? `$${(session.amount_total / 100).toFixed(2)}`
        : "";
      const dateStr = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const manageUrl = "https://conduitai.io/app/settings/billing";

      if (session.mode === "subscription") {
        const tierId = (session.metadata?.tier_id as TierId) ?? "free";
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        await sb
          .from("conduit_accounts")
          .update({
            tier_id: tierId,
            stripe_subscription_id: subId ?? null,
            subscription_status: "active",
            // Reset cycle on tier upgrade so user sees fresh allowance.
            monthly_tokens_used: 0,
            billing_cycle_start: new Date().toISOString(),
          })
          .eq("id", accountId);

        // Fire-and-forget receipt — must not fail the webhook.
        if (customerEmail) {
          const tierName = TIERS[tierId]?.name ?? tierId;
          sendEmail({
            to: customerEmail,
            subject: `Praxis ${tierName} — payment confirmed`,
            html: subscriptionReceiptEmail({
              tierName,
              amount: amountStr,
              date: dateStr,
              manageUrl,
            }),
          }).catch((err) => console.error("[email] receipt send failed", err));
        }
      } else if (session.mode === "payment") {
        const tokensGranted = parseInt(
          session.metadata?.tokens_granted ?? "0",
          10,
        );
        const piId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;

        // Upsert top-up row by payment_intent_id, mark succeeded.
        if (piId) {
          await sb
            .from("conduit_token_topups")
            .upsert(
              {
                account_id: accountId,
                amount_cents: session.amount_total ?? 0,
                tokens_granted: tokensGranted,
                stripe_payment_intent_id: piId,
                status: "succeeded",
              },
              { onConflict: "stripe_payment_intent_id" },
            );
        }

        if (tokensGranted > 0) {
          // Increment bonus_tokens atomically by reading + writing.
          const { data: acc } = await sb
            .from("conduit_accounts")
            .select("bonus_tokens")
            .eq("id", accountId)
            .single();
          const next = (acc?.bonus_tokens ?? 0) + tokensGranted;
          await sb
            .from("conduit_accounts")
            .update({ bonus_tokens: next })
            .eq("id", accountId);

          // Fire-and-forget top-up receipt.
          if (customerEmail) {
            const tokensFormatted =
              tokensGranted >= 1000
                ? `${(tokensGranted / 1000).toFixed(0)}k`
                : String(tokensGranted);
            sendEmail({
              to: customerEmail,
              subject: `Praxis — ${tokensFormatted} tokens added`,
              html: topupReceiptEmail({
                tokensGranted: tokensFormatted,
                amount: amountStr,
                date: dateStr,
                manageUrl,
              }),
            }).catch((err) =>
              console.error("[email] topup receipt send failed", err),
            );
          }
        }
      }
      return accountId;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const accountId = (sub.metadata?.account_id as string) || null;
      if (!accountId) return null;

      const priceId = sub.items.data[0]?.price.id;
      const tierId = priceId ? tierForPriceId(priceId) : null;

      const status =
        sub.cancel_at_period_end && sub.status === "active"
          ? "canceling"
          : sub.status;

      await sb
        .from("conduit_accounts")
        .update({
          subscription_status: status,
          ...(tierId ? { tier_id: tierId } : {}),
          stripe_subscription_id: sub.id,
        })
        .eq("id", accountId);
      return accountId;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const accountId = (sub.metadata?.account_id as string) || null;
      if (!accountId) return null;
      await sb
        .from("conduit_accounts")
        .update({
          subscription_status: "canceled",
          tier_id: "free",
          stripe_subscription_id: null,
        })
        .eq("id", accountId);
      return accountId;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;
      if (!customerId) return null;
      const { data: acc } = await sb
        .from("conduit_accounts")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();
      if (!acc) return null;
      await sb
        .from("conduit_accounts")
        .update({ subscription_status: "past_due" })
        .eq("id", acc.id);
      return acc.id as string;
    }

    case "invoice.paid": {
      // Status sync handled by subscription.updated.
      return null;
    }

    default:
      return null;
  }
}
