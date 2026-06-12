// Shared email layout wrapper (table-based for Gmail/Apple Mail compatibility).
// Background: warm black (#0A0908). Accent: indigo (#5B63E8). On-brand ember CTA.

export function emailBase({
  title,
  previewText,
  body,
}: {
  title: string;
  previewText: string;
  body: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
</head>
<body style="margin:0;padding:0;background:#0A0908;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <!-- Preview text (hidden, for inbox snippet) -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#0A0908;">${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0A0908;min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

          <!-- Logo / wordmark -->
          <tr>
            <td align="center" style="padding-bottom:40px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <!-- Praxis mark — two overlapping circles (simplified inline SVG as image fallback) -->
                    <img src="https://conduitai.io/praxis-mark.png" alt="Praxis" width="36" height="36"
                      style="display:block;border:0;" />
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="font-size:18px;font-weight:600;letter-spacing:-0.02em;color:#F5EFE6;">Praxis</span>
                    <span style="font-size:12px;color:#847A6E;margin-left:8px;letter-spacing:0.04em;text-transform:uppercase;">by Conduit AI</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#14110F;border:1px solid #1F1C19;border-radius:16px;padding:40px 40px 36px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#5A5248;line-height:1.7;">
                Conduit AI, Inc. · <a href="https://conduitai.io" style="color:#847A6E;text-decoration:none;">conduitai.io</a>
                <br />You're receiving this because you have a Praxis account.
                <br /><a href="https://conduitai.io/legal/privacy" style="color:#847A6E;text-decoration:underline;">Privacy Policy</a>
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

// CTA button — indigo primary
export function ctaButton(text: string, href: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:28px auto 0;">
    <tr>
      <td align="center" bgcolor="#5B63E8" style="border-radius:12px;">
        <a href="${href}" target="_blank"
          style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:500;color:#FFFFFF;text-decoration:none;letter-spacing:-0.005em;border-radius:12px;background:#5B63E8;">
          ${text}
        </a>
      </td>
    </tr>
  </table>`;
}

// Divider
export const divider = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
  <tr><td style="border-top:1px solid #1F1C19;"></td></tr>
</table>`;

// Section label
export function label(text: string): string {
  return `<p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#5B63E8;">${text}</p>`;
}

// Value row (for receipts)
export function lineItem(name: string, value: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
    <tr>
      <td style="font-size:14px;color:#8C8884;">${name}</td>
      <td align="right" style="font-size:14px;color:#F5EFE6;font-weight:500;">${value}</td>
    </tr>
  </table>`;
}
