import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { receiptEmail } from "@/emails";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: {
    planName?: string;
    amount?: string;
    billingPeriod?: string;
    invoiceId?: string;
    receiptUrl?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (!body.planName || !body.amount) {
    return NextResponse.json(
      { error: "planName and amount are required" },
      { status: 400 },
    );
  }

  const name =
    (user.user_metadata?.full_name as string | undefined) ?? undefined;

  try {
    await sendEmail({
      to: user.email!,
      subject: body.billingPeriod
        ? `Your ${body.planName} plan receipt for ${body.billingPeriod}`
        : `Your ${body.planName} receipt`,
      html: receiptEmail({
        name,
        planName: body.planName,
        amount: body.amount,
        billingPeriod: body.billingPeriod,
        invoiceId: body.invoiceId,
        receiptUrl: body.receiptUrl,
      }),
    });
  } catch (err) {
    console.error("[email/receipt]", err);
    return NextResponse.json(
      { error: "email_send_failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
