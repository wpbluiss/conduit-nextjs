import { emailLayout, T } from "./layout";

/** Welcome / email-verify — paste HTML into Supabase Auth > Email Templates > Confirm signup */
export function welcomeEmail(opts: {
  firstName: string;
  verifyUrl: string;
}): string {
  const { firstName, verifyUrl } = opts;
  const content = [
    T.h1(`Welcome to Praxis${firstName ? `, ${firstName}` : ""}.`),
    T.p("Your AI workforce is ready. Verify your email to open the Console and meet your team — Atlas, Marketing, Engineering, and six more specialists standing by."),
    T.cta("Verify my email", verifyUrl),
    T.divider(),
    T.muted("If you didn't create a Praxis account, you can safely ignore this email."),
    T.muted(`Or paste this URL into your browser:<br/><span style="word-break:break-all;">${verifyUrl}</span>`),
  ].join("");
  return emailLayout(content, `Verify your Praxis email`);
}

/** Password reset — paste HTML into Supabase Auth > Email Templates > Reset password */
export function passwordResetEmail(opts: {
  firstName: string;
  resetUrl: string;
}): string {
  const { firstName, resetUrl } = opts;
  const content = [
    T.h1("Reset your password"),
    T.p(`Hi${firstName ? ` ${firstName}` : ""},`),
    T.p("We received a request to reset the password for your Praxis account. Click the button below — this link expires in 1 hour."),
    T.cta("Reset password", resetUrl),
    T.divider(),
    T.muted("If you didn't request a password reset, your account is safe — you can ignore this email."),
    T.muted(`Or paste this URL into your browser:<br/><span style="word-break:break-all;">${resetUrl}</span>`),
  ].join("");
  return emailLayout(content, "Reset your Praxis password");
}

export type ReceiptLineItem = {
  description: string;
  amount: string;
};

/** Payment receipt — sent programmatically after successful Stripe charge */
export function receiptEmail(opts: {
  firstName: string;
  items: ReceiptLineItem[];
  subtotal: string;
  total: string;
  paymentDate: string;
  receiptId: string;
}): string {
  const { firstName, items, subtotal, total, paymentDate, receiptId } = opts;

  const rows = items
    .map((item) =>
      T.meta(item.description, item.amount),
    )
    .join("");

  const content = [
    T.h1("Payment confirmed"),
    T.p(`Hi${firstName ? ` ${firstName}` : ""},`),
    T.p("Your payment was processed successfully. Here's your receipt."),

    // Receipt table
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 24px;">
      <tbody>
        ${rows}
        ${T.meta("Total", `<strong>${total}</strong>`)}
      </tbody>
    </table>`,

    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;background:#F4F2EC;border-radius:10px;">
      <tr>
        <td style="padding:16px 20px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="font-size:12px;color:#7B8194;">Receipt #</td>
              <td style="font-size:12px;color:#7B8194;text-align:right;">Date</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#0F1115;font-weight:500;padding-top:4px;">${receiptId}</td>
              <td style="font-size:13px;color:#0F1115;font-weight:500;text-align:right;padding-top:4px;">${paymentDate}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`,

    T.divider(),
    T.muted("Charges appear as <strong>CONDUIT AI</strong> on your statement. Questions? Reply to this email."),
  ].join("");

  return emailLayout(content, `Payment receipt · ${total}`);
}

/** Account deletion confirmation — sent after account is deleted */
export function accountDeletedEmail(opts: { firstName: string }): string {
  const { firstName } = opts;
  const content = [
    T.h1("Your account has been deleted"),
    T.p(`Hi${firstName ? ` ${firstName}` : ""},`),
    T.p("Your Praxis account and all associated data have been permanently deleted as requested. This action cannot be undone."),
    T.divider(),
    T.muted("If you change your mind, you're always welcome back at <a href=\"https://conduitai.io/auth/sign-up\" style=\"color:#5B63E8;text-decoration:none;\">conduitai.io</a>."),
    T.muted("If you didn't request account deletion, please contact us immediately at <a href=\"mailto:luis@conduitai.io\" style=\"color:#5B63E8;text-decoration:none;\">luis@conduitai.io</a>."),
  ].join("");
  return emailLayout(content, "Your Praxis account has been deleted");
}
