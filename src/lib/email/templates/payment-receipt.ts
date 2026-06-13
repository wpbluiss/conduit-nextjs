import { emailBase, ctaButton, divider, label, lineItem } from "../base";

export interface PaymentReceiptData {
  customerEmail: string;
  amountPaid: number; // in cents
  currency: string;
  description: string;
  invoiceId: string;
  chargeDate: string; // ISO date string
  receiptUrl?: string;
  dashboardUrl?: string;
}

export function paymentReceiptEmail(
  data: PaymentReceiptData,
): { subject: string; html: string } {
  const amount = (data.amountPaid / 100).toLocaleString("en-US", {
    style: "currency",
    currency: data.currency.toUpperCase(),
  });

  const dateFormatted = new Date(data.chargeDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return {
    subject: `Payment receipt — ${amount} · Praxis`,
    html: emailBase({
      title: "Payment receipt",
      previewText: `Your ${amount} payment to Praxis has been processed.`,
      body: `
        <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;letter-spacing:-0.03em;color:#F5EFE6;line-height:1.2;">
          Payment confirmed.
        </h1>
        <p style="margin:12px 0 0;font-size:16px;color:#8C8884;line-height:1.6;">
          Your payment of <strong style="color:#F5EFE6;">${amount}</strong> has been processed.
          Thank you for using Praxis.
        </p>

        ${divider}

        ${label("Summary")}
        ${lineItem("Description", data.description)}
        ${lineItem("Amount", amount)}
        ${lineItem("Date", dateFormatted)}
        ${lineItem("Invoice", data.invoiceId)}

        ${divider}

        ${ctaButton(
          data.receiptUrl ? "View receipt →" : "Open Praxis Console →",
          data.receiptUrl ?? data.dashboardUrl ?? "https://conduitai.io/app/settings/billing",
        )}

        <p style="margin:24px 0 0;font-size:13px;color:#5A5248;text-align:center;">
          Manage your subscription at
          <a href="https://conduitai.io/app/settings/billing" style="color:#847A6E;">
            conduitai.io/app/settings/billing
          </a>
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:36px;padding-top:28px;border-top:1px solid #1F1C19;">
          <tr>
            <td style="font-size:13px;color:#5A5248;line-height:1.7;">
              Questions about your bill? Contact
              <a href="mailto:luis@conduitai.io" style="color:#847A6E;">luis@conduitai.io</a>.
            </td>
          </tr>
        </table>
      `,
    }),
  };
}
