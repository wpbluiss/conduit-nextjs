import { emailBase, ctaButton, divider } from "../base";

export interface DigestSpecialist {
  name: string;
  conversationCount: number;
  artifactCount: number;
  color: string;
}

export function weeklyDigestEmail({
  displayName,
  weekStart,
  weekEnd,
  specialists,
  totalConversations,
  totalArtifacts,
  appUrl,
  unsubscribeUrl,
}: {
  displayName: string | null;
  weekStart: string;
  weekEnd: string;
  specialists: DigestSpecialist[];
  totalConversations: number;
  totalArtifacts: number;
  appUrl: string;
  unsubscribeUrl: string;
}): { subject: string; html: string } {
  const greeting = displayName ? `Hi ${displayName},` : "Hi there,";

  const specialistRows =
    specialists.length > 0
      ? specialists
          .map(
            (s) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #1F1C19;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="width:8px;padding-right:12px;vertical-align:middle;">
                  <div style="width:8px;height:8px;border-radius:50%;background:${s.color};"></div>
                </td>
                <td style="font-size:14px;color:#F5EFE6;font-weight:500;">${s.name}</td>
                <td align="right" style="font-size:13px;color:#8C8884;">
                  ${s.conversationCount} ${s.conversationCount === 1 ? "conversation" : "conversations"}
                  ${s.artifactCount > 0 ? ` · ${s.artifactCount} ${s.artifactCount === 1 ? "artifact" : "artifacts"}` : ""}
                </td>
              </tr>
            </table>
          </td>
        </tr>`,
          )
          .join("")
      : `<tr><td style="padding:16px 0;font-size:14px;color:#5A5248;text-align:center;">
          No activity this week — your team is ready when you are.
        </td></tr>`;

  const summaryLine =
    totalConversations > 0
      ? `Your team handled <strong style="color:#F5EFE6;">${totalConversations} ${totalConversations === 1 ? "conversation" : "conversations"}</strong> and produced <strong style="color:#F5EFE6;">${totalArtifacts} ${totalArtifacts === 1 ? "artifact" : "artifacts"}</strong> this week.`
      : `Your Praxis team is standing by. Start a conversation to put them to work.`;

  const body = `
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;letter-spacing:-0.03em;color:#F5EFE6;line-height:1.2;">
      Your team this week
    </h1>
    <p style="margin:4px 0 0;font-size:13px;color:#5A5248;letter-spacing:0.02em;">
      ${weekStart} – ${weekEnd}
    </p>

    <p style="margin:20px 0 0;font-size:15px;color:#8C8884;line-height:1.6;">
      ${greeting}
    </p>
    <p style="margin:8px 0 24px;font-size:15px;color:#8C8884;line-height:1.6;">
      ${summaryLine}
    </p>

    ${divider}

    <p style="margin:0 0 12px;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#5B63E8;">
      Specialist activity
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${specialistRows}
    </table>

    ${ctaButton("Open Praxis →", appUrl)}

    ${divider}

    <p style="margin:0;font-size:12px;color:#5A5248;text-align:center;line-height:1.7;">
      <a href="${unsubscribeUrl}" style="color:#5A5248;text-decoration:underline;">Unsubscribe</a>
      from weekly digests · this email contains only activity counts, never message content.
    </p>
  `;

  return {
    subject: `Your Praxis team this week (${weekStart})`,
    html: emailBase({
      title: "Your Praxis team this week",
      previewText:
        totalConversations > 0
          ? `${totalConversations} conversations, ${totalArtifacts} artifacts this week from your AI team.`
          : "Your Praxis AI team is ready to get to work.",
      body,
    }),
  };
}
