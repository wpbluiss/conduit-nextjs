import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConnectorToken } from "./google-calendar";

export interface GitHubPR {
  number: number;
  title: string;
  state: string;
  draft: boolean;
  author: string;
  url: string;
  updatedAt: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  state: string;
  author: string;
  url: string;
  updatedAt: string;
}

export interface GitHubCIRun {
  name: string;
  status: string;
  conclusion: string | null;
  updatedAt: string;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface GitHubRepoContext {
  repo: string;
  openPRs: GitHubPR[];
  openIssues: GitHubIssue[];
  latestCI: GitHubCIRun | null;
  recentCommits: GitHubCommit[];
}

const GH_HEADERS = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

// ── OAuth helpers ────────────────────────────────────────────────────────────

export function isGithubOAuthConfigured(): boolean {
  return Boolean(
    process.env.GITHUB_OAUTH_CLIENT_ID && process.env.GITHUB_OAUTH_CLIENT_SECRET,
  );
}

export function getGithubRedirectUri(): string {
  return `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/conduit/connectors/github/callback`;
}

export function getGithubOAuthUrl(state: string): string {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  if (!clientId) throw new Error("GITHUB_OAUTH_CLIENT_ID not set");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGithubRedirectUri(),
    scope: "repo,read:user",
    state,
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

export async function exchangeGithubCode(
  code: string,
): Promise<{ access_token: string; scope: string }> {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { ...GH_HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
      client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
      code,
      redirect_uri: getGithubRedirectUri(),
    }),
  });
  if (!res.ok) throw new Error("GitHub token exchange failed");
  const json = (await res.json()) as {
    access_token?: string;
    scope?: string;
    error?: string;
    error_description?: string;
  };
  if (json.error || !json.access_token) {
    throw new Error(json.error_description ?? json.error ?? "GitHub OAuth error");
  }
  return { access_token: json.access_token, scope: json.scope ?? "repo,read:user" };
}

export async function fetchGithubUserLogin(
  token: string,
): Promise<{ login: string } | null> {
  const res = await fetch("https://api.github.com/user", {
    headers: { ...GH_HEADERS, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { login?: string };
  return json.login ? { login: json.login } : null;
}

export async function fetchGithubUserRepos(token: string): Promise<string[]> {
  const res = await fetch(
    "https://api.github.com/user/repos?sort=updated&per_page=10&affiliation=owner,collaborator",
    { headers: { ...GH_HEADERS, Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return [];
  const items = (await res.json()) as Array<{ full_name: string }>;
  return items.map((r) => r.full_name);
}

// ── Token retrieval ──────────────────────────────────────────────────────────

export async function getGithubToken(
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

// ── Context fetchers ─────────────────────────────────────────────────────────

async function fetchRepoPRs(token: string, owner: string, repo: string): Promise<GitHubPR[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=10&sort=updated`,
    { headers: { ...GH_HEADERS, Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return [];
  const items = (await res.json()) as Array<{
    number: number;
    title: string;
    state: string;
    draft: boolean;
    user?: { login?: string };
    html_url: string;
    updated_at: string;
  }>;
  return items.map((p) => ({
    number: p.number,
    title: p.title,
    state: p.state,
    draft: p.draft,
    author: p.user?.login ?? "unknown",
    url: p.html_url,
    updatedAt: p.updated_at,
  }));
}

async function fetchRepoIssues(token: string, owner: string, repo: string): Promise<GitHubIssue[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=10&sort=updated`,
    { headers: { ...GH_HEADERS, Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return [];
  const items = (await res.json()) as Array<{
    number: number;
    title: string;
    state: string;
    user?: { login?: string };
    html_url: string;
    updated_at: string;
    pull_request?: unknown;
  }>;
  return items
    .filter((i) => !i.pull_request)
    .map((i) => ({
      number: i.number,
      title: i.title,
      state: i.state,
      author: i.user?.login ?? "unknown",
      url: i.html_url,
      updatedAt: i.updated_at,
    }));
}

async function fetchLatestCIRun(token: string, owner: string, repo: string): Promise<GitHubCIRun | null> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=1&branch=main`,
    { headers: { ...GH_HEADERS, Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as {
    workflow_runs?: Array<{
      name: string;
      status: string;
      conclusion: string | null;
      updated_at: string;
    }>;
  };
  const run = json.workflow_runs?.[0];
  if (!run) return null;
  return { name: run.name, status: run.status, conclusion: run.conclusion, updatedAt: run.updated_at };
}

async function fetchRecentCommits(
  token: string,
  owner: string,
  repo: string,
): Promise<GitHubCommit[]> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits?since=${since}&per_page=10`,
    { headers: { ...GH_HEADERS, Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return [];
  const items = (await res.json()) as Array<{
    sha: string;
    commit: {
      message: string;
      author?: { name?: string; date?: string };
    };
  }>;
  return items.map((c) => ({
    sha: c.sha.slice(0, 7),
    message: (c.commit.message ?? "").split("\n")[0].slice(0, 100),
    author: c.commit.author?.name ?? "unknown",
    date: c.commit.author?.date ?? "",
  }));
}

export async function fetchGithubContext(
  token: string,
  repos: string[],
): Promise<GitHubRepoContext[]> {
  const results: GitHubRepoContext[] = [];
  for (const repoSlug of repos.slice(0, 5)) {
    const parts = repoSlug.split("/");
    if (parts.length !== 2) continue;
    const [owner, repo] = parts;
    try {
      const [openPRs, openIssues, latestCI, recentCommits] = await Promise.all([
        fetchRepoPRs(token, owner, repo),
        fetchRepoIssues(token, owner, repo),
        fetchLatestCIRun(token, owner, repo),
        fetchRecentCommits(token, owner, repo),
      ]);
      results.push({ repo: repoSlug, openPRs, openIssues, latestCI, recentCommits });
    } catch {
      // Non-fatal: skip this repo on error.
    }
  }
  return results;
}

export function renderGithubBlock(contexts: GitHubRepoContext[]): string {
  if (contexts.length === 0) return "";
  const lines: string[] = ["GITHUB REPOSITORY CONTEXT:"];
  for (const ctx of contexts) {
    lines.push(`\nRepo: ${ctx.repo}`);
    if (ctx.openPRs.length > 0) {
      lines.push(`Open PRs (${ctx.openPRs.length}):`);
      for (const pr of ctx.openPRs.slice(0, 5)) {
        const draft = pr.draft ? " [DRAFT]" : "";
        lines.push(`  #${pr.number}${draft}: ${pr.title} (@${pr.author})`);
      }
    } else {
      lines.push("Open PRs: none");
    }
    if (ctx.openIssues.length > 0) {
      lines.push(`Open Issues (${ctx.openIssues.length}):`);
      for (const issue of ctx.openIssues.slice(0, 5)) {
        lines.push(`  #${issue.number}: ${issue.title} (@${issue.author})`);
      }
    } else {
      lines.push("Open Issues: none");
    }
    if (ctx.latestCI) {
      const ci = ctx.latestCI;
      const status = ci.conclusion ? `${ci.status} (${ci.conclusion})` : ci.status;
      lines.push(`Latest CI run: "${ci.name}" — ${status}`);
    }
    if (ctx.recentCommits.length > 0) {
      lines.push(`Recent commits (last 7 days, ${ctx.recentCommits.length}):`);
      for (const commit of ctx.recentCommits.slice(0, 5)) {
        lines.push(`  ${commit.sha}: ${commit.message} (@${commit.author})`);
      }
    }
  }
  lines.push("");
  return lines.join("\n") + "\n";
}
