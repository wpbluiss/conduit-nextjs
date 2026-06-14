import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConnectorToken } from "./google-calendar";

export interface LinkedInPost {
  id: string;
  text: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
}

export interface LinkedInCompanyUpdate {
  id: string;
  text: string;
  createdAt: string;
}

export function isLinkedInConfigured(): boolean {
  return Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
}

export function getLinkedInRedirectUri(): string {
  return `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/conduit/connectors/linkedin/callback`;
}

export function getLinkedInOAuthUrl(state: string): string {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) throw new Error("LINKEDIN_CLIENT_ID not set");
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: getLinkedInRedirectUri(),
    state,
    scope: "r_liteprofile r_emailaddress r_organization_social w_member_social",
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
}

export async function exchangeLinkedInCode(
  code: string,
): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      redirect_uri: getLinkedInRedirectUri(),
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LinkedIn token exchange failed: ${err}`);
  }
  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}

export async function getLinkedInToken(
  supabase: SupabaseClient,
  accountId: string,
): Promise<ConnectorToken | null> {
  const { data } = await supabase
    .from("conduit_connector_tokens")
    .select("*")
    .eq("account_id", accountId)
    .eq("provider", "linkedin")
    .maybeSingle();
  return (data as ConnectorToken | null) ?? null;
}

export async function getLinkedInPersonUrn(accessToken: string): Promise<string | null> {
  const res = await fetch("https://api.linkedin.com/v2/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { id?: string };
  return json.id ? `urn:li:person:${json.id}` : null;
}

export async function getRecentPersonalPosts(
  accessToken: string,
  personUrn: string,
  limit = 5,
): Promise<LinkedInPost[]> {
  const params = new URLSearchParams({
    q: "authors",
    authors: `List(${encodeURIComponent(personUrn)})`,
    count: String(limit),
    sortBy: "LAST_MODIFIED",
  });
  const res = await fetch(
    `https://api.linkedin.com/v2/ugcPosts?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    },
  );
  if (!res.ok) return [];
  const json = (await res.json()) as {
    elements?: Array<{
      id?: string;
      specificContent?: {
        "com.linkedin.ugc.ShareContent"?: {
          shareCommentary?: { text?: string };
        };
      };
      firstPublishedAt?: number;
      socialDetail?: {
        totalSocialActivityCounts?: {
          numLikes?: number;
          numComments?: number;
        };
      };
    }>;
  };
  return (json.elements ?? []).map((p) => ({
    id: p.id ?? "",
    text: (
      p.specificContent?.["com.linkedin.ugc.ShareContent"]?.shareCommentary?.text ?? ""
    ).slice(0, 500),
    createdAt: p.firstPublishedAt
      ? new Date(p.firstPublishedAt).toISOString().slice(0, 10)
      : "",
    likeCount: p.socialDetail?.totalSocialActivityCounts?.numLikes ?? 0,
    commentCount: p.socialDetail?.totalSocialActivityCounts?.numComments ?? 0,
  }));
}

export async function getRecentCompanyUpdates(
  supabase: SupabaseClient,
  token: ConnectorToken,
  limit = 5,
): Promise<LinkedInCompanyUpdate[]> {
  const orgUrn = (token.meta as Record<string, unknown>)?.org_urn as string | undefined;
  if (!orgUrn) return [];

  const params = new URLSearchParams({
    q: "authors",
    authors: `List(${encodeURIComponent(orgUrn)})`,
    count: String(limit),
    sortBy: "LAST_MODIFIED",
  });
  const res = await fetch(
    `https://api.linkedin.com/v2/ugcPosts?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    },
  );
  if (!res.ok) return [];
  const json = (await res.json()) as {
    elements?: Array<{
      id?: string;
      specificContent?: {
        "com.linkedin.ugc.ShareContent"?: {
          shareCommentary?: { text?: string };
        };
      };
      firstPublishedAt?: number;
    }>;
  };

  // Increment usage counter (non-blocking).
  void supabase
    .from("conduit_connector_tokens")
    .update({ fetch_count: (token.fetch_count ?? 0) + 1, last_fetched_at: new Date().toISOString() })
    .eq("id", token.id);

  return (json.elements ?? []).map((p) => ({
    id: p.id ?? "",
    text: (
      p.specificContent?.["com.linkedin.ugc.ShareContent"]?.shareCommentary?.text ?? ""
    ).slice(0, 500),
    createdAt: p.firstPublishedAt
      ? new Date(p.firstPublishedAt).toISOString().slice(0, 10)
      : "",
  }));
}

export function renderLinkedInBlock(
  posts: LinkedInPost[],
  companyUpdates: LinkedInCompanyUpdate[],
): string {
  if (posts.length === 0 && companyUpdates.length === 0) return "";
  const lines: string[] = [];
  if (posts.length > 0) {
    lines.push(`LINKEDIN — YOUR RECENT POSTS (last ${posts.length}):`);
    for (const p of posts) {
      const engagement = p.likeCount + p.commentCount > 0
        ? ` [${p.likeCount} likes, ${p.commentCount} comments]`
        : "";
      lines.push(`- (${p.createdAt}) ${p.text}${engagement}`);
    }
  }
  if (companyUpdates.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push(`LINKEDIN — COMPANY PAGE UPDATES (last ${companyUpdates.length}):`);
    for (const u of companyUpdates) {
      lines.push(`- (${u.createdAt}) ${u.text}`);
    }
  }
  return lines.join("\n") + "\n\n";
}
