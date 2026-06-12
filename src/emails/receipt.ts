import {
  emailWrapper,
  emailH1,
  emailP,
  emailButton,
  emailDivider,
  emailKV,
  BRAND,
} from "./base";

export interface ReceiptEmailData {
  name?: string;
  planName: string;
  amount: string;       // e.g. "$29.00"
  billingPeriod?: string; // e.g. "June 2026" for subscription, omit for one-time
  invoiceId?: string;
  receiptUrl?: string;
  dashboardUrl?: string;
}

export function receiptEmail({
  name,
  planName,
  amount,
  billingPeriod,
  invoiceId,
  receiptUrl,
  dashboardUrl = `${BRAND.appUrl}/app/settings`,
}: ReceiptEmailData): string {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const subject = billingPeriod
    ? `Your ${planName} plan receipt for ${billingPeriod}`
    : `Your ${planName} receipt`;

  const details = [
    emailKV("Plan", planName),
    emailKV("Amount", amount),
    billingPeriod ? emailKV("Billing period", billingPeriod) : "",
    invoiceId ? emailKV("Invoice ID", invoiceId) : "",
  ]
    .filter(Boolean)
    .join("");

  const content = `
    ${emailH1("Payment confirmed")}
    ${emailP(`${greeting} thanks for your Praxis subscription. Your payment was processed successfully.`)}
    <!-- Receipt table -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
           style="background:${BRAND.surfaceRaised};border-radius:10px;border:1px solid ${BRAND.border};padding:20px 20px 12px;margin:0 0 24px;">
      <tr><td>${details}</td></tr>
    </table>
    ${receiptUrl ? emailButton("View full receipt", receiptUrl) : emailButton("Go to settings", dashboardUrl)}
    ${emailDivider()}
    ${emailP("Questions about your invoice? Reply to this email — we're here to help.", true)}`;

  return emailWrapper(content, subject);
}
