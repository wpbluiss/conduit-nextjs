/**
 * Shared layout shell for all Praxis transactional emails.
 * Table-based, inline styles — compatible with Gmail, Apple Mail, Outlook.
 *
 * Brand: dark warm-black (#0A0815) canvas, ember accent (#FF6B2C),
 * Geist-fallback sans-serif, cream text (#F5F1EA).
 */

export const BRAND = {
  accent: "#FF6B2C",      // ember
  accentDark: "#E55A1F",
  bg: "#0A0815",
  surface: "#131027",
  surfaceRaised: "#1A152F",
  border: "rgba(245,241,234,0.12)",
  text: "#F5F1EA",
  textMuted: "#8A88A4",
  fontStack:
    "'Geist', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  logoUrl: "https://conduitai.io/praxis-mark.png",
  appUrl: "https://conduitai.io",
};

export function emailWrapper(content: string, previewText = ""): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Praxis</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .outer { width: 100% !important; }
      .inner { width: 100% !important; padding: 0 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bg};font-family:${BRAND.fontStack};">
  ${previewText ? `<div style="display:none;font-size:1px;color:${BRAND.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ""}
  <!-- Wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${BRAND.bg};margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:40px 20px 48px;">
        <!-- Card -->
        <table class="outer" role="presentation" cellpadding="0" cellspacing="0" width="520"
               style="background-color:${BRAND.surface};border-radius:16px;border:1px solid ${BRAND.border};overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid ${BRAND.border};">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <img src="${BRAND.logoUrl}" alt="Praxis" width="22" height="33"
                         style="display:inline-block;vertical-align:middle;margin-right:10px;" />
                    <span style="font-family:${BRAND.fontStack};font-size:15px;font-weight:600;color:${BRAND.text};vertical-align:middle;letter-spacing:-0.01em;">Praxis</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td class="inner" style="padding:36px 40px 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid ${BRAND.border};">
              <p style="margin:0;font-size:12px;color:${BRAND.textMuted};line-height:1.6;">
                You're receiving this email because you have an account with Praxis by Conduit AI.
                &nbsp;·&nbsp;
                <a href="${BRAND.appUrl}/settings" style="color:${BRAND.textMuted};text-decoration:underline;">Manage preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function emailH1(text: string): string {
  return `<h1 style="margin:0 0 12px;font-family:${BRAND.fontStack};font-size:24px;font-weight:700;color:${BRAND.text};letter-spacing:-0.03em;line-height:1.25;">${text}</h1>`;
}

export function emailP(text: string, muted = false): string {
  return `<p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:${muted ? BRAND.textMuted : BRAND.text};">${text}</p>`;
}

export function emailButton(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="border-radius:10px;background:${BRAND.accent};">
        <a href="${href}"
           style="display:inline-block;padding:13px 28px;font-family:${BRAND.fontStack};font-size:15px;font-weight:600;color:#fff;text-decoration:none;border-radius:10px;letter-spacing:-0.01em;">${label}</a>
      </td>
    </tr>
  </table>`;
}

export function emailDivider(): string {
  return `<hr style="border:0;border-top:1px solid ${BRAND.border};margin:24px 0;" />`;
}

export function emailKV(label: string, value: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:8px;">
    <tr>
      <td style="font-size:13px;color:${BRAND.textMuted};width:120px;padding-bottom:6px;">${label}</td>
      <td style="font-size:13px;color:${BRAND.text};font-weight:500;padding-bottom:6px;">${value}</td>
    </tr>
  </table>`;
}
