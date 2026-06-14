import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConnectorToken } from "./google-calendar";

export interface NotionPage {
  id: string;
  title: string;
  url: string;
}

export interface NotionBlock {
  type: string;
  text: string;
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
): Promise<{ access_token: string; workspace_id: string; workspace_name: string }> {
  const clientId = process.env.NOTION_CLIENT_ID!;
  const clientSecret = process.env.NOTION_CLIENT_SECRET!;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
      "Notion-Version": "2022-06-28",
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
    access_token?: string;
    workspace_id?: string;
    workspace_name?: string;
    error?: string;
  };
  if (json.error || !json.access_token) {
    throw new Error(`Notion OAuth error: ${json.error}`);
  }
  return {
    access_token: json.access_token,
    workspace_id: json.workspace_id ?? "",
    workspace_name: json.workspace_name ?? "",
  };
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

export async function searchNotionPages(
  accessToken: string,
  query = "",
): Promise<NotionPage[]> {
  const body: Record<string, unknown> = {
    filter: { property: "object", value: "page" },
    page_size: 50,
  };
  if (query) body.query = query;
  const res = await fetch("https://api.notion.com/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    results?: Array<{
      id: string;
      url: string;
      properties?: Record<string, { title?: Array<{ plain_text: string }> }>;
    }>;
  };
  return (json.results ?? []).map((p) => {
    const titleProp = Object.values(p.properties ?? {}).find(
      (v) => Array.isArray(v.title),
    );
    const title = titleProp?.title?.map((t) => t.plain_text).join("") ?? "(Untitled)";
    return { id: p.id.replace(/-/g, ""), title, url: p.url };
  });
}

export async function getNotionPageContent(
  accessToken: string,
  pageId: string,
  maxChars = 2000,
): Promise<string> {
  const res = await fetch(
    `https://api.notion.com/v1/blocks/${pageId}/children?page_size=50`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Notion-Version": "2022-06-28",
      },
    },
  );
  if (!res.ok) return "";
  const json = (await res.json()) as {
    results?: Array<{
      type: string;
      paragraph?: { rich_text: Array<{ plain_text: string }> };
      heading_1?: { rich_text: Array<{ plain_text: string }> };
      heading_2?: { rich_text: Array<{ plain_text: string }> };
      heading_3?: { rich_text: Array<{ plain_text: string }> };
      bulleted_list_item?: { rich_text: Array<{ plain_text: string }> };
      numbered_list_item?: { rich_text: Array<{ plain_text: string }> };
      to_do?: { rich_text: Array<{ plain_text: string }>; checked: boolean };
      toggle?: { rich_text: Array<{ plain_text: string }> };
      quote?: { rich_text: Array<{ plain_text: string }> };
      callout?: { rich_text: Array<{ plain_text: string }> };
    }>;
  };
  const lines: string[] = [];
  for (const block of json.results ?? []) {
    const richText = (arr: Array<{ plain_text: string }> | undefined) =>
      (arr ?? []).map((t) => t.plain_text).join("");
    let line = "";
    switch (block.type) {
      case "heading_1":
        line = `# ${richText(block.heading_1?.rich_text)}`;
        break;
      case "heading_2":
        line = `## ${richText(block.heading_2?.rich_text)}`;
        break;
      case "heading_3":
        line = `### ${richText(block.heading_3?.rich_text)}`;
        break;
      case "paragraph":
        line = richText(block.paragraph?.rich_text);
        break;
      case "bulleted_list_item":
        line = `• ${richText(block.bulleted_list_item?.rich_text)}`;
        break;
      case "numbered_list_item":
        line = richText(block.numbered_list_item?.rich_text);
        break;
      case "to_do":
        line = `[${block.to_do?.checked ? "x" : " "}] ${richText(block.to_do?.rich_text)}`;
        break;
      case "toggle":
        line = richText(block.toggle?.rich_text);
        break;
      case "quote":
        line = `> ${richText(block.quote?.rich_text)}`;
        break;
      case "callout":
        line = richText(block.callout?.rich_text);
        break;
    }
    if (line.trim()) lines.push(line.trim());
  }
  const text = lines.join("\n");
  return text.length > maxChars ? text.slice(0, maxChars) + "…" : text;
}

export function renderNotionBlock(
  pages: Array<{ title: string; content: string }>,
): string {
  if (pages.length === 0) return "";
  const lines = ["NOTION WORKSPACE CONTEXT:"];
  for (const { title, content } of pages) {
    if (!content.trim()) continue;
    lines.push(`\n[${title}]`);
    lines.push(content);
  }
  return lines.join("\n") + "\n\n";
}
