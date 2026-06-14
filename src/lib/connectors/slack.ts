import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConnectorToken } from "./google-calendar";

export interface SlackMessage {
  ts: string;
  user: string;
  text: string;
}

export interface SlackChannel {
  id: string;
  name: string;
  is_member: boolean;
}

export function isSlackConfigured(): boolean {
  return Boolean(process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET);
}

export function getSlackOAuthUrl(state: string): string {
  const clientId = process.env.SLACK_CLIENT_ID;
  if (!clientId) throw new Error("SLACK_CLIENT_ID not set");
  const redirectUri = getSlackRedirectUri();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "channels:history,channels:read",
    state,
  });
  return `https://slack.com/oauth/v2/authorize?${params}`;
}

export function getSlackRedirectUri(): string {
  return `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/conduit/connectors/slack/callback`;
}

export async function exchangeSlackCode(
  code: string,
): Promise<{ access_token: string; scope: string; authed_user?: { id: string } }> {
  const clientId = process.env.SLACK_CLIENT_ID!;
  const clientSecret = process.env.SLACK_CLIENT_SECRET!;
  const res = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getSlackRedirectUri(),
    }),
  });
  if (!res.ok) throw new Error("Slack token exchange failed");
  const json = (await res.json()) as { ok: boolean; access_token?: string; scope?: string; error?: string; authed_user?: { id: string } };
  if (!json.ok) throw new Error(`Slack OAuth error: ${json.error}`);
  return {
    access_token: json.access_token!,
    scope: json.scope ?? "",
    authed_user: json.authed_user,
  };
}

export async function listSlackChannels(accessToken: string): Promise<SlackChannel[]> {
  const res = await fetch(
    "https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=100&exclude_archived=true",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) return [];
  const json = (await res.json()) as {
    ok: boolean;
    channels?: Array<{ id: string; name: string; is_member: boolean }>;
  };
  if (!json.ok) return [];
  return (json.channels ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    is_member: c.is_member,
  }));
}

export async function getRecentMessages(
  accessToken: string,
  channelId: string,
  limit = 20,
): Promise<SlackMessage[]> {
  const params = new URLSearchParams({
    channel: channelId,
    limit: String(limit),
  });
  const res = await fetch(`https://slack.com/api/conversations.history?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    ok: boolean;
    messages?: Array<{ ts: string; user?: string; text?: string; subtype?: string }>;
  };
  if (!json.ok) return [];
  return (json.messages ?? [])
    .filter((m) => !m.subtype) // skip bot/join messages
    .map((m) => ({
      ts: m.ts,
      user: m.user ?? "unknown",
      text: (m.text ?? "").slice(0, 500),
    }))
    .reverse(); // chronological order
}

export async function getSlackToken(
  supabase: SupabaseClient,
  accountId: string,
): Promise<ConnectorToken | null> {
  const { data } = await supabase
    .from("conduit_connector_tokens")
    .select("*")
    .eq("account_id", accountId)
    .eq("provider", "slack")
    .maybeSingle();
  return (data as ConnectorToken | null) ?? null;
}

export function renderSlackBlock(
  messages: SlackMessage[],
  channelName: string,
): string {
  if (messages.length === 0) return "";
  const lines = [`RECENT SLACK MESSAGES (#${channelName}, last ${messages.length}):` ];
  for (const m of messages) {
    lines.push(`- ${m.text}`);
  }
  return lines.join("\n") + "\n\n";
}
