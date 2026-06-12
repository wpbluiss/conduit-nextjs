import {
  emailWrapper,
  emailH1,
  emailP,
  emailButton,
  emailDivider,
  BRAND,
} from "./base";

export interface ResetPasswordEmailData {
  resetUrl: string;
}

export function resetPasswordEmail({ resetUrl }: ResetPasswordEmailData): string {
  const content = `
    ${emailH1("Reset your password")}
    ${emailP("We received a request to reset the password for your Praxis account. Click the button below to choose a new password.")}
    ${emailButton("Reset password", resetUrl)}
    ${emailDivider()}
    ${emailP(
      "If you didn't request a password reset, you can safely ignore this email — your password won't change. This link expires in 1 hour.",
      true,
    )}
    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};line-height:1.6;">
      Or copy this URL into your browser:<br/>
      <a href="${resetUrl}" style="color:${BRAND.textMuted};word-break:break-all;">${resetUrl}</a>
    </p>`;

  return emailWrapper(content, "Reset your Praxis password");
}
