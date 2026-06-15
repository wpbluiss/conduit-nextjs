import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { getStripe, isBillingConfigured } from "@/lib/billing/stripe";

export const runtime = "nodejs";

export interface InvoiceItem {
  id: string;
  date: number;
  amount: number;
  currency: string;
  status: string;
  pdf_url: string | null;
}

export async function GET() {
  if (!isBillingConfigured()) {
    return NextResponse.json({ invoices: [] });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const account = await getOrCreateAccount(supabase, user);
  if (!account.stripe_customer_id) {
    return NextResponse.json({ invoices: [] });
  }

  const stripe = getStripe();
  const list = await stripe.invoices.list({
    customer: account.stripe_customer_id,
    limit: 12,
  });

  const invoices: InvoiceItem[] = list.data.map((inv) => ({
    id: inv.id,
    date: inv.created,
    amount: inv.amount_paid,
    currency: inv.currency,
    status: inv.status ?? "unknown",
    pdf_url: inv.invoice_pdf ?? null,
  }));

  return NextResponse.json({ invoices });
}
