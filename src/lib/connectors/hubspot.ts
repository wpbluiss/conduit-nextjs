import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConnectorToken } from "./google-calendar";

export interface HubSpotContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  lastModified: string;
}

export interface HubSpotDeal {
  id: string;
  name: string;
  stage: string;
  amount: string | null;
  closeDate: string | null;
  lastModified: string;
}

export function isHubSpotConfigured(): boolean {
  return Boolean(process.env.HUBSPOT_CLIENT_ID && process.env.HUBSPOT_CLIENT_SECRET);
}

export function getHubSpotRedirectUri(): string {
  return `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/conduit/connectors/hubspot/callback`;
}

export function getHubSpotOAuthUrl(state: string): string {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  if (!clientId) throw new Error("HUBSPOT_CLIENT_ID not set");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getHubSpotRedirectUri(),
    scope: "crm.objects.contacts.read crm.objects.deals.read",
    state,
  });
  return `https://app.hubspot.com/oauth/authorize?${params}`;
}

export async function exchangeHubSpotCode(
  code: string,
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const res = await fetch("https://api.hubapi.com/oauth/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.HUBSPOT_CLIENT_ID!,
      client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
      redirect_uri: getHubSpotRedirectUri(),
      code,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HubSpot token exchange failed: ${err}`);
  }
  return res.json() as Promise<{ access_token: string; refresh_token: string; expires_in: number }>;
}

async function refreshHubSpotToken(
  refreshToken: string,
): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch("https://api.hubapi.com/oauth/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.HUBSPOT_CLIENT_ID!,
      client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error("HubSpot token refresh failed");
  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}

async function ensureFreshToken(
  supabase: SupabaseClient,
  token: ConnectorToken,
): Promise<string> {
  if (token.expires_at) {
    const expiresAt = new Date(token.expires_at).getTime();
    if (expiresAt > Date.now() + 60_000) return token.access_token;
  }
  if (!token.refresh_token) return token.access_token;
  try {
    const refreshed = await refreshHubSpotToken(token.refresh_token);
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

export async function getHubSpotToken(
  supabase: SupabaseClient,
  accountId: string,
): Promise<ConnectorToken | null> {
  const { data } = await supabase
    .from("conduit_connector_tokens")
    .select("*")
    .eq("account_id", accountId)
    .eq("provider", "hubspot")
    .maybeSingle();
  return (data as ConnectorToken | null) ?? null;
}

export async function getRecentContacts(
  supabase: SupabaseClient,
  token: ConnectorToken,
  limit = 10,
): Promise<HubSpotContact[]> {
  const accessToken = await ensureFreshToken(supabase, token);
  const params = new URLSearchParams({
    limit: String(limit),
    properties: "firstname,lastname,email,company,lastmodifieddate",
    sort: "-lastmodifieddate",
  });
  const res = await fetch(
    `https://api.hubapi.com/crm/v3/objects/contacts?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) return [];
  const json = (await res.json()) as {
    results?: Array<{
      id: string;
      properties: {
        firstname?: string;
        lastname?: string;
        email?: string;
        company?: string;
        lastmodifieddate?: string;
      };
    }>;
  };
  return (json.results ?? []).map((c) => ({
    id: c.id,
    firstName: c.properties.firstname ?? "",
    lastName: c.properties.lastname ?? "",
    email: c.properties.email ?? "",
    company: c.properties.company ?? "",
    lastModified: c.properties.lastmodifieddate ?? "",
  }));
}

export async function getOpenDeals(
  supabase: SupabaseClient,
  token: ConnectorToken,
  limit = 5,
): Promise<HubSpotDeal[]> {
  const accessToken = await ensureFreshToken(supabase, token);
  const params = new URLSearchParams({
    limit: String(limit),
    properties: "dealname,dealstage,amount,closedate,hs_lastmodifieddate",
    sort: "-hs_lastmodifieddate",
    filterGroups: JSON.stringify([
      {
        filters: [
          { propertyName: "dealstage", operator: "NEQ", value: "closedwon" },
          { propertyName: "dealstage", operator: "NEQ", value: "closedlost" },
        ],
      },
    ]),
  });
  const res = await fetch(
    `https://api.hubapi.com/crm/v3/objects/deals/search`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        limit,
        sorts: [{ propertyName: "hs_lastmodifieddate", direction: "DESCENDING" }],
        properties: ["dealname", "dealstage", "amount", "closedate", "hs_lastmodifieddate"],
        filterGroups: [
          {
            filters: [
              { propertyName: "dealstage", operator: "NEQ", value: "closedwon" },
              { propertyName: "dealstage", operator: "NEQ", value: "closedlost" },
            ],
          },
        ],
      }),
    },
  );
  if (!res.ok) return [];
  const json = (await res.json()) as {
    results?: Array<{
      id: string;
      properties: {
        dealname?: string;
        dealstage?: string;
        amount?: string;
        closedate?: string;
        hs_lastmodifieddate?: string;
      };
    }>;
  };
  // Increment usage counter (non-blocking).
  void supabase
    .from("conduit_connector_tokens")
    .update({ fetch_count: (token.fetch_count ?? 0) + 1, last_fetched_at: new Date().toISOString() })
    .eq("id", token.id);
  return (json.results ?? []).map((d) => ({
    id: d.id,
    name: d.properties.dealname ?? "(unnamed deal)",
    stage: d.properties.dealstage ?? "",
    amount: d.properties.amount ?? null,
    closeDate: d.properties.closedate ?? null,
    lastModified: d.properties.hs_lastmodifieddate ?? "",
  }));
}

export function renderHubSpotBlock(
  contacts: HubSpotContact[],
  deals: HubSpotDeal[],
): string {
  if (contacts.length === 0 && deals.length === 0) return "";
  const lines: string[] = [];
  if (contacts.length > 0) {
    lines.push(`HUBSPOT CRM — RECENT CONTACTS (last ${contacts.length}):`);
    for (const c of contacts) {
      const name = [c.firstName, c.lastName].filter(Boolean).join(" ") || "(no name)";
      const company = c.company ? ` at ${c.company}` : "";
      lines.push(`- ${name}${company}${c.email ? ` <${c.email}>` : ""}`);
    }
  }
  if (deals.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push(`HUBSPOT CRM — OPEN DEALS (${deals.length}):`);
    for (const d of deals) {
      const amount = d.amount ? ` — $${Number(d.amount).toLocaleString()}` : "";
      const close = d.closeDate ? ` (closes ${d.closeDate.slice(0, 10)})` : "";
      lines.push(`- ${d.name}${amount} [${d.stage}]${close}`);
    }
  }
  return lines.join("\n") + "\n\n";
}
