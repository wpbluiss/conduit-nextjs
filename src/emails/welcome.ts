import {
  emailWrapper,
  emailH1,
  emailP,
  emailButton,
  emailDivider,
  BRAND,
} from "./base";

export interface WelcomeEmailData {
  name?: string;
  confirmUrl: string;
}

export function welcomeEmail({ name, confirmUrl }: WelcomeEmailData): string {
  const greeting = name ? `Hi ${name},` : "Welcome to Praxis,";
  const content = `
    ${emailH1("Confirm your email")}
    ${emailP(`${greeting} you're one step away from your AI workforce. Confirm your address to activate your account.`)}
    ${emailButton("Confirm email address", confirmUrl)}
    ${emailDivider()}
    ${emailP(
      `If you didn't create a Praxis account, you can safely ignore this email.
      This link expires in 24 hours.`,
      true,
    )}
    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};line-height:1.6;">
      Or copy this URL into your browser:<br/>
      <a href="${confirmUrl}" style="color:${BRAND.textMuted};word-break:break-all;">${confirmUrl}</a>
    </p>`;

  return emailWrapper(
    content,
    "Confirm your email to activate your Praxis account",
  );
}
