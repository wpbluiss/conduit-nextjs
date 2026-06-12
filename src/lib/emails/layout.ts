// Brand tokens hard-coded for email (CSS variables don't work in email clients)
const C = {
  canvas:   "#FAFAF7",   // warm bone background
  surface:  "#FFFFFF",
  border:   "#E0DACF",
  ink:      "#0F1115",
  inkSoft:  "#4A5160",
  inkMute:  "#7B8194",
  indigo:   "#5B63E8",
  indigoDk: "#3D44C2",
  ember:    "#D67817",
  white:    "#FFFFFF",
};

export function emailLayout(content: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${previewText}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; background-color: ${C.canvas}; }
    @media only screen and (max-width: 600px) {
      .wrapper { width: 100% !important; }
      .card { border-radius: 0 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${C.canvas};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <!-- Preview text -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.canvas};">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Card -->
        <table role="presentation" class="wrapper card" width="560" cellpadding="0" cellspacing="0" border="0"
          style="background-color:${C.surface};border:1px solid ${C.border};border-radius:16px;overflow:hidden;">

          <!-- Top accent bar -->
          <tr>
            <td height="3" style="background:linear-gradient(90deg,${C.indigo},${C.ember});font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding:40px 48px 32px;" align="center">
              ${wordmark()}
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:0 48px 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 48px;border-top:1px solid ${C.border};background-color:${C.canvas};">
              ${footer()}
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>
</body>
</html>`;
}

function wordmark(): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td>
        <!-- Praxis P mark — inline SVG; Outlook falls back to text -->
        <!--[if !mso]><!-->
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-right:10px;">
          <rect width="32" height="32" rx="8" fill="${C.indigo}"/>
          <path d="M10 22V10h7c2.8 0 4.5 1.7 4.5 4.2S19.8 18.4 17 18.4h-4V22H10zm3-6.6h3.8c1.2 0 1.9-.7 1.9-1.8s-.7-1.7-1.9-1.7H13v3.5z" fill="white"/>
        </svg>
        <!--<![endif]-->
        <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:20px;font-weight:600;color:${C.ink};letter-spacing:-0.5px;vertical-align:middle;">Praxis</span>
        <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:${C.inkMute};vertical-align:middle;margin-left:8px;">by Conduit AI</span>
      </td>
    </tr>
  </table>`;
}

function footer(): string {
  return `<p style="margin:0;font-size:12px;color:${C.inkMute};line-height:1.6;">
    You're receiving this because you have a Praxis account. Questions?
    Reply to this email or contact
    <a href="mailto:luis@conduitai.io" style="color:${C.indigo};text-decoration:none;">luis@conduitai.io</a>.<br/>
    Conduit AI · conduitai.io
  </p>`;
}

// Reusable primitives used by individual templates
export const T = {
  h1: (text: string) =>
    `<h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:${C.ink};letter-spacing:-0.5px;line-height:1.25;">${text}</h1>`,

  p: (text: string) =>
    `<p style="margin:0 0 20px;font-size:16px;color:${C.inkSoft};line-height:1.7;">${text}</p>`,

  muted: (text: string) =>
    `<p style="margin:0 0 16px;font-size:14px;color:${C.inkMute};line-height:1.6;">${text}</p>`,

  cta: (label: string, url: string) =>
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
      <tr>
        <td style="border-radius:12px;background-color:${C.indigo};">
          <a href="${url}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:500;color:${C.white};text-decoration:none;border-radius:12px;letter-spacing:-0.2px;">${label}</a>
        </td>
      </tr>
    </table>`,

  divider: () =>
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;">
      <tr><td height="1" style="background-color:${C.border};font-size:0;line-height:0;">&nbsp;</td></tr>
    </table>`,

  meta: (label: string, value: string) =>
    `<tr>
      <td style="padding:10px 0;font-size:14px;color:${C.inkMute};border-bottom:1px solid ${C.border};">${label}</td>
      <td style="padding:10px 0;font-size:14px;color:${C.ink};font-weight:500;text-align:right;border-bottom:1px solid ${C.border};">${value}</td>
    </tr>`,
};
