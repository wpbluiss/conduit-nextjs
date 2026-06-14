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

export interface GitHubRepoContext {
  repo: string;
  openPRs: GitHubPR[];
  openIssues: GitHubIssue[];
  latestCI: GitHubCIRun | null;
}

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

export async function validateGithubPat(pat: string): Promise<{ login: string } | null> {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${pat}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { login?: string };
  return json.login ? { login: json.login } : null;
}

async function fetchRepoPRs(pat: string, owner: string, repo: string): Promise<GitHubPR[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=10&sort=updated`,
    {
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
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

async function fetchRepoIssues(pat: string, owner: string, repo: string): Promise<GitHubIssue[]> {
  // GitHub issues API includes PRs; filter them out with `is:issue`
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=10&sort=updated`,
    {
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
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
    .filter((i) => !i.pull_request) // exclude PRs from issues endpoint
    .map((i) => ({
      number: i.number,
      title: i.title,
      state: i.state,
      author: i.user?.login ?? "unknown",
      url: i.html_url,
      updatedAt: i.updated_at,
    }));
}

async function fetchLatestCIRun(pat: string, owner: string, repo: string): Promise<GitHubCIRun | null> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=1&branch=main`,
    {
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
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
  return {
    name: run.name,
    status: run.status,
    conclusion: run.conclusion,
    updatedAt: run.updated_at,
  };
}

export async function fetchGithubContext(
  pat: string,
  repos: string[],
): Promise<GitHubRepoContext[]> {
  const results: GitHubRepoContext[] = [];
  for (const repoSlug of repos.slice(0, 5)) {
    const parts = repoSlug.split("/");
    if (parts.length !== 2) continue;
    const [owner, repo] = parts;
    try {
      const [openPRs, openIssues, latestCI] = await Promise.all([
        fetchRepoPRs(pat, owner, repo),
        fetchRepoIssues(pat, owner, repo),
        fetchLatestCIRun(pat, owner, repo),
      ]);
      results.push({ repo: repoSlug, openPRs, openIssues, latestCI });
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
  }
  lines.push("");
  return lines.join("\n") + "\n";
}
