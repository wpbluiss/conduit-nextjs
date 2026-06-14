import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConnectorToken } from "./google-calendar";

export interface GitHubPR {
  number: number;
  title: string;
  state: string;
  url: string;
  author: string;
  createdAt: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  state: string;
  url: string;
  author: string;
  createdAt: string;
}

export interface GitHubRepo {
  owner: string;
  name: string;
}

export function isGitHubConfigured(): boolean {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}

export function getGitHubOAuthUrl(state: string): string {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) throw new Error("GITHUB_CLIENT_ID not set");
  const redirectUri = getGitHubRedirectUri();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "repo",
    state,
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

export function getGitHubRedirectUri(): string {
  return `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/conduit/connectors/github/callback`;
}

export async function exchangeGitHubCode(
  code: string,
): Promise<{ access_token: string; scope: string }> {
  const clientId = process.env.GITHUB_CLIENT_ID!;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET!;
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: getGitHubRedirectUri(),
    }),
  });
  if (!res.ok) throw new Error("GitHub token exchange failed");
  const json = (await res.json()) as {
    access_token?: string;
    scope?: string;
    error?: string;
    error_description?: string;
  };
  if (json.error) throw new Error(`GitHub OAuth error: ${json.error}`);
  return {
    access_token: json.access_token!,
    scope: json.scope ?? "",
  };
}

export async function getGitHubToken(
  supabase: SupabaseClient,
  accountId: string,
): Promise<ConnectorToken | null> {
  const { data } = await supabase
    .from("conduit_connector_tokens")
    .select("*")
    .eq("account_id", accountId)
    .eq("provider", "github")
    .maybeSingle();
  return (data as ConnectorToken | null) ?? null;
}

export async function listUserRepos(
  accessToken: string,
  limit = 5,
): Promise<GitHubRepo[]> {
  const params = new URLSearchParams({
    sort: "pushed",
    direction: "desc",
    per_page: String(limit),
  });
  const res = await fetch(`https://api.github.com/user/repos?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as Array<{ full_name: string; owner: { login: string }; name: string }>;
  return json.slice(0, limit).map((r) => ({
    owner: r.owner.login,
    name: r.name,
  }));
}

export async function getOpenPRs(
  accessToken: string,
  repo: GitHubRepo,
  limit = 10,
): Promise<GitHubPR[]> {
  const params = new URLSearchParams({ state: "open", per_page: String(limit) });
  const res = await fetch(
    `https://api.github.com/repos/${repo.owner}/${repo.name}/pulls?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
  if (!res.ok) return [];
  const json = (await res.json()) as Array<{
    number: number;
    title: string;
    state: string;
    html_url: string;
    user: { login: string };
    created_at: string;
  }>;
  return json.map((pr) => ({
    number: pr.number,
    title: pr.title,
    state: pr.state,
    url: pr.html_url,
    author: pr.user.login,
    createdAt: pr.created_at,
  }));
}

export async function getOpenIssues(
  accessToken: string,
  repo: GitHubRepo,
  limit = 10,
): Promise<GitHubIssue[]> {
  const params = new URLSearchParams({
    state: "open",
    per_page: String(limit),
    pulls: "false",
  });
  const res = await fetch(
    `https://api.github.com/repos/${repo.owner}/${repo.name}/issues?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
  if (!res.ok) return [];
  const json = (await res.json()) as Array<{
    number: number;
    title: string;
    state: string;
    html_url: string;
    user: { login: string };
    created_at: string;
    pull_request?: unknown;
  }>;
  // Filter out PRs (GitHub issues API returns both)
  return json
    .filter((i) => !i.pull_request)
    .map((i) => ({
      number: i.number,
      title: i.title,
      state: i.state,
      url: i.html_url,
      author: i.user.login,
      createdAt: i.created_at,
    }));
}

export function renderGitHubBlock(
  repos: Array<{ repo: GitHubRepo; prs: GitHubPR[]; issues: GitHubIssue[] }>,
): string {
  if (repos.length === 0) return "";
  const lines = ["GITHUB REPOSITORY STATUS:"];
  for (const { repo, prs, issues } of repos) {
    lines.push(`\nRepo: ${repo.owner}/${repo.name}`);
    if (prs.length > 0) {
      lines.push(`  Open PRs (${prs.length}):`);
      for (const pr of prs.slice(0, 5)) {
        lines.push(`    #${pr.number}: ${pr.title} (by @${pr.author})`);
      }
    } else {
      lines.push("  Open PRs: none");
    }
    if (issues.length > 0) {
      lines.push(`  Open Issues (${issues.length}):`);
      for (const issue of issues.slice(0, 5)) {
        lines.push(`    #${issue.number}: ${issue.title} (by @${issue.author})`);
      }
    } else {
      lines.push("  Open Issues: none");
    }
  }
  return lines.join("\n") + "\n\n";
}
