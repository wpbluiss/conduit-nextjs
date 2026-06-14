import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConnectorToken } from "./google-calendar";

export interface NotionPage {
  id: string;
  title: string;
  url: string;
  last_edited_time: string;
}

export function isNotionConfigured(): boolean {
  return Boolean(process.env.NOTION_CLIENT_ID && process.env.NOTION_CLIENT_SECRET);
}

export function getNotionOAuthUrl(state: string): string {
  const clientId = process.env.NOTION_CLIENT_ID;
  if (!clientId) throw new Error("NOTION_CLIENT_ID not set");
  const redirectUri = getNotionRedirectUri();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    owner: "user",
    state,
  });
  return `https://api.notion.com/v1/oauth/authorize?${params}`;
}

export function getNotionRedirectUri(): string {
  return `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/conduit/connectors/notion/callback`;
}

export async function exchangeNotionCode(
  code: string,
): Promise<{ access_token: string; workspace_id: string; workspace_name: string; bot_id: string }> {
  const clientId = process.env.NOTION_CLIENT_ID!;
  const clientSecret = process.env.NOTION_CLIENT_SECRET!;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: getNotionRedirectUri(),
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Notion token exchange failed: ${err}`);
  }
  const json = (await res.json()) as {
    access_token: string;
    workspace_id: string;
    workspace_name: string;
    bot_id: string;
  };
  return json;
}

export async function searchNotionPages(
  accessToken: string,
  query = "",
): Promise<NotionPage[]> {
  const res = await fetch("https://api.notion.com/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({
      query,
      filter: { value: "page", property: "object" },
      sort: { direction: "descending", timestamp: "last_edited_time" },
      page_size: 50,
    }),
  });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    results?: Array<{
      id: string;
      url: string;
      last_edited_time: string;
      properties?: { title?: { title?: Array<{ plain_text: string }> } };
    }>;
  };
  return (json.results ?? []).map((p) => ({
    id: p.id,
    title:
      p.properties?.title?.title?.map((t) => t.plain_text).join("") || "(Untitled)",
    url: p.url,
    last_edited_time: p.last_edited_time,
  }));
}

function extractTextFromBlock(block: Record<string, unknown>): string {
  const type = block.type as string | undefined;
  if (!type) return "";
  const typeData = block[type] as Record<string, unknown> | undefined;
  if (!typeData) return "";
  const richText = typeData.rich_text as Array<{ plain_text?: string }> | undefined;
  if (richText && Array.isArray(richText)) {
    return richText.map((t) => t.plain_text ?? "").join("");
  }
  return "";
}

export async function fetchNotionPageText(
  accessToken: string,
  pageId: string,
  maxChars = 4000,
): Promise<string> {
  // Get top-level blocks (single page of results, max 100).
  const res = await fetch(
    `https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Notion-Version": "2022-06-28",
      },
    },
  );
  if (!res.ok) return "";
  const json = (await res.json()) as {
    results?: Array<Record<string, unknown>>;
  };
  const lines: string[] = [];
  for (const block of json.results ?? []) {
    const text = extractTextFromBlock(block);
    if (text) lines.push(text);
    if (lines.join("\n").length >= maxChars) break;
  }
  const full = lines.join("\n");
  return full.length > maxChars ? full.slice(0, maxChars) + "…" : full;
}

export async function syncNotionPages(
  supabase: SupabaseClient,
  accountId: string,
  accessToken: string,
  pageIds: string[],
): Promise<void> {
  for (const pageId of pageIds) {
    try {
      // Fetch page title via page endpoint.
      const pageRes = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Notion-Version": "2022-06-28",
        },
      });
      let title = "(Untitled)";
      if (pageRes.ok) {
        const pageJson = (await pageRes.json()) as {
          properties?: { title?: { title?: Array<{ plain_text: string }> } };
        };
        title =
          pageJson.properties?.title?.title
            ?.map((t) => t.plain_text)
            .join("") || "(Untitled)";
      }
      const content = await fetchNotionPageText(accessToken, pageId);
      if (!content) continue;
      await supabase.from("conduit_connector_cache").upsert(
        {
          account_id: accountId,
          provider: "notion",
          cache_key: pageId,
          title,
          content,
          synced_at: new Date().toISOString(),
        },
        { onConflict: "account_id,provider,cache_key" },
      );
    } catch {
      // Non-fatal: skip this page on error.
    }
  }
}

export async function getNotionToken(
  supabase: SupabaseClient,
  accountId: string,
): Promise<ConnectorToken | null> {
  const { data } = await supabase
    .from("conduit_connector_tokens")
    .select("*")
    .eq("account_id", accountId)
    .eq("provider", "notion")
    .maybeSingle();
  return (data as ConnectorToken | null) ?? null;
}

export async function getNotionCachedPages(
  supabase: SupabaseClient,
  accountId: string,
): Promise<Array<{ cache_key: string; title: string | null; content: string }>> {
  const { data } = await supabase
    .from("conduit_connector_cache")
    .select("cache_key, title, content")
    .eq("account_id", accountId)
    .eq("provider", "notion")
    .order("synced_at", { ascending: false })
    .limit(5);
  return (data ?? []) as Array<{ cache_key: string; title: string | null; content: string }>;
}

export function renderNotionBlock(
  pages: Array<{ cache_key: string; title: string | null; content: string }>,
): string {
  if (pages.length === 0) return "";
  const lines = ["NOTION WORKSPACE CONTEXT (synced pages):"];
  for (const page of pages) {
    lines.push(`\n## ${page.title ?? "Page"}`);
    lines.push(page.content);
  }
  return lines.join("\n") + "\n\n";
}
