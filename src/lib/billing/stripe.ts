import Stripe from "stripe";

let cached: Stripe | null = null;

/**
 * Lazy-initialised Stripe client. Throws BILLING_NOT_CONFIGURED if the secret
 * key isn't set so we can return 503 from billing routes without crashing
 * unrelated paths.
 */
export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("BILLING_NOT_CONFIGURED");
  cached = new Stripe(key);
  return cached;
}

export function isBillingConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getPublishableKey(): string | null {
  return process.env.STRIPE_PUBLISHABLE_KEY ?? null;
}

export function getWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET ?? null;
}
