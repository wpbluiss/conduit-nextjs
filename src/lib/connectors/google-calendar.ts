import type { SupabaseClient } from "@supabase/supabase-js";

export interface ConnectorToken {
  id: string;
  account_id: string;
  provider: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  scope: string | null;
  meta: Record<string, unknown>;
  fetch_count: number;
  last_fetched_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;  // ISO 8601
  end: string;
  isAllDay: boolean;
}

export function isGoogleCalendarConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
}

export function getGoogleOAuthUrl(state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID not set");
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/supabase\.co.*/, "conduitai.io") ?? ""}/api/conduit/connectors/google-calendar/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export function getGoogleRedirectUri(): string {
  return `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/conduit/connectors/google-calendar/callback`;
}

export async function exchangeGoogleCode(
  code: string,
): Promise<{ access_token: string; refresh_token?: string; expires_in: number; scope: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getGoogleRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }
  return res.json() as Promise<{ access_token: string; refresh_token?: string; expires_in: number; scope: string }>;
}

async function refreshGoogleToken(
  refreshToken: string,
): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error("Google token refresh failed");
  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}

export async function getConnectorToken(
  supabase: SupabaseClient,
  accountId: string,
  provider: string,
): Promise<ConnectorToken | null> {
  const { data } = await supabase
    .from("conduit_connector_tokens")
    .select("*")
    .eq("account_id", accountId)
    .eq("provider", provider)
    .maybeSingle();
  return (data as ConnectorToken | null) ?? null;
}

export async function getConnectedProviders(
  supabase: SupabaseClient,
  accountId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("conduit_connector_tokens")
    .select("provider")
    .eq("account_id", accountId);
  return (data ?? []).map((r: { provider: string }) => r.provider);
}

async function ensureFreshToken(
  supabase: SupabaseClient,
  token: ConnectorToken,
): Promise<string> {
  if (token.expires_at) {
    const expiresAt = new Date(token.expires_at).getTime();
    const nowMs = Date.now();
    if (expiresAt > nowMs + 60_000) return token.access_token;
  }
  if (!token.refresh_token) return token.access_token;
  try {
    const refreshed = await refreshGoogleToken(token.refresh_token);
    const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
    await supabase
      .from("conduit_connector_tokens")
      .update({
        access_token: refreshed.access_token,
        expires_at: newExpiry,
        updated_at: new Date().toISOString(),
      })
      .eq("id", token.id);
    return refreshed.access_token;
  } catch {
    return token.access_token;
  }
}

export async function getUpcomingEvents(
  supabase: SupabaseClient,
  token: ConnectorToken,
  limit = 10,
): Promise<CalendarEvent[]> {
  const accessToken = await ensureFreshToken(supabase, token);
  const now = new Date().toISOString();
  const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({
    timeMin: now,
    timeMax: twoWeeks,
    maxResults: String(limit),
    singleEvents: "true",
    orderBy: "startTime",
  });
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) return [];
  const json = (await res.json()) as {
    items?: Array<{
      id: string;
      summary?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
    }>;
  };
  const events = (json.items ?? []).map((e) => ({
    id: e.id,
    summary: e.summary ?? "(no title)",
    start: e.start?.dateTime ?? e.start?.date ?? "",
    end: e.end?.dateTime ?? e.end?.date ?? "",
    isAllDay: Boolean(e.start?.date && !e.start?.dateTime),
  }));
  // Fire-and-forget: increment usage counter (non-blocking, never breaks chat on failure).
  void supabase
    .from("conduit_connector_tokens")
    .update({ fetch_count: (token.fetch_count ?? 0) + 1, last_fetched_at: new Date().toISOString() })
    .eq("id", token.id);
  return events;
}

export function renderCalendarBlock(events: CalendarEvent[]): string {
  if (events.length === 0) return "";
  const lines = ["UPCOMING CALENDAR EVENTS (next 14 days):"];
  for (const e of events) {
    const start = e.isAllDay
      ? e.start.slice(0, 10)
      : new Date(e.start).toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZone: "UTC",
        });
    lines.push(`- ${start}: ${e.summary}`);
  }
  return lines.join("\n") + "\n\n";
}
