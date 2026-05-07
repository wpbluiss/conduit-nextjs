// R7: real Engineering execution.
// Creates a GitHub repo, pushes a template's generated files, links a Vercel
// project to it, polls for the live URL. Emits progress events to the
// supplied callback so the chat SSE stream can pump them to the client.

import { getTemplate } from "./templates";
import { TEMPLATES } from "./templates";
import type { TemplateModule } from "./templates/types";

export type BuildEventType =
  | "plan_started"
  | "plan_done"
  | "marketing_briefed"
  | "customizing"
  | "repo_created"
  | "files_pushed"
  | "project_created"
  | "deploying"
  | "live"
  | "failed";

export interface BuildEvent {
  type: BuildEventType;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface BuildResult {
  ok: boolean;
  buildSlug: string;
  liveUrl?: string;
  repoUrl?: string;
  vercelProjectId?: string;
  vercelDeploymentId?: string;
  error?: string;
}

export interface BuildInput {
  templateId: string;
  buildName: string;
  config: Record<string, unknown>;
  onProgress: (e: BuildEvent) => void | Promise<void>;
}

const GITHUB_API = "https://api.github.com";
const VERCEL_API = "https://api.vercel.com";

export function isEngineeringConfigured(): boolean {
  return Boolean(
    (process.env.GITHUB_PAT || process.env.GITHUB_APP_TOKEN) &&
      process.env.VERCEL_API_TOKEN,
  );
}

export function githubOwner(): string {
  return process.env.CONDUIT_BUILDS_GITHUB_OWNER || "wpbluiss";
}

function githubToken(): string {
  return (
    process.env.GITHUB_PAT ||
    process.env.GITHUB_APP_TOKEN ||
    ""
  );
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

export function uniqueSlug(base: string): string {
  const stamp = Date.now().toString(36).slice(-5);
  return `${base || "build"}-${stamp}`;
}

export function listTemplates(): TemplateModule[] {
  return Object.values(TEMPLATES);
}

/**
 * Heuristic template matcher — small, no LLM call. The chat route can elevate
 * to a Haiku-classified match if this fails.
 */
export function heuristicTemplateMatch(message: string): string | null {
  const m = message.toLowerCase();
  if (/\b(crm|lead.{0,3}list|kanban|pipeline)\b/.test(m)) return "basic-crm";
  if (/\b(blog|posts?|articles?|publish|writing site)\b/.test(m)) return "blog";
  if (/\b(lead capture|email signup|waitlist|coming soon)\b/.test(m))
    return "lead-capture";
  if (/\b(contact form|contact page|reach me|get in touch)\b/.test(m))
    return "contact-form";
  if (/\b(landing page|website|homepage|home page|marketing site|site for my)\b/.test(m))
    return "landing-page";
  return null;
}

async function ghCreateRepo(name: string): Promise<{ html_url: string; default_branch: string }> {
  const r = await fetch(`${GITHUB_API}/orgs/${githubOwner()}/repos`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${githubToken()}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      name,
      private: false,
      auto_init: true,
      description: "Built by Conduit",
    }),
  });
  if (!r.ok) {
    // org route fails for personal accounts — fall back to user route.
    const r2 = await fetch(`${GITHUB_API}/user/repos`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken()}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        name,
        private: false,
        auto_init: true,
        description: "Built by Conduit",
      }),
    });
    if (!r2.ok) {
      throw new Error(`github_create_failed_${r2.status}`);
    }
    return r2.json();
  }
  return r.json();
}

async function ghPutFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  branch: string,
  message = "init from conduit",
): Promise<void> {
  // GET first to check if exists (auto_init creates a README; we may need its sha to overwrite).
  let sha: string | undefined;
  const head = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`,
    {
      headers: {
        Authorization: `Bearer ${githubToken()}`,
        Accept: "application/vnd.github+json",
      },
    },
  );
  if (head.ok) {
    const j = await head.json();
    sha = j.sha;
  }
  const r = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${githubToken()}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        message,
        content: Buffer.from(content, "utf8").toString("base64"),
        branch,
        ...(sha ? { sha } : {}),
      }),
    },
  );
  if (!r.ok) {
    const body = await r.text().catch(() => "");
    throw new Error(`github_put_${path}_${r.status}_${body.slice(0, 120)}`);
  }
}

interface VercelProject {
  id: string;
  name: string;
  link?: { type: string; repoId?: number };
}

async function vercelCreateProject(
  name: string,
  owner: string,
  repo: string,
): Promise<VercelProject> {
  const r = await fetch(`${VERCEL_API}/v10/projects`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      framework: "nextjs",
      gitRepository: { type: "github", repo: `${owner}/${repo}` },
    }),
  });
  if (!r.ok) {
    const body = await r.text().catch(() => "");
    throw new Error(`vercel_create_project_${r.status}_${body.slice(0, 200)}`);
  }
  return r.json();
}

async function vercelLatestDeployment(
  projectId: string,
): Promise<{ id: string; url: string; readyState: string } | null> {
  const r = await fetch(
    `${VERCEL_API}/v6/deployments?projectId=${encodeURIComponent(projectId)}&limit=1`,
    {
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
      },
    },
  );
  if (!r.ok) return null;
  const j = (await r.json()) as { deployments?: Array<{ uid: string; url: string; state: string }> };
  const d = j.deployments?.[0];
  if (!d) return null;
  return { id: d.uid, url: d.url, readyState: d.state };
}

export async function executeBuild(input: BuildInput): Promise<BuildResult> {
  const tmpl = getTemplate(input.templateId);
  if (!tmpl) {
    return { ok: false, buildSlug: "", error: "template_not_found" };
  }

  const buildSlug = uniqueSlug(slugify(input.buildName));

  await input.onProgress({
    type: "plan_started",
    message: `Picked the ${tmpl.meta.name} template. ETA ~${tmpl.meta.estimated_build_time_seconds}s.`,
    metadata: { template: tmpl.meta.id, slug: buildSlug },
  });

  if (!isEngineeringConfigured()) {
    return {
      ok: false,
      buildSlug,
      error: "engineering_not_configured",
    };
  }

  await input.onProgress({
    type: "customizing",
    message: "Customizing the template with your business details.",
  });

  const files = tmpl.generateFiles(input.config);

  // 1. Create the repo
  const owner = githubOwner();
  const repoName = `conduit-builds-${buildSlug}`;
  await input.onProgress({
    type: "repo_created",
    message: "Creating a fresh repository for this build.",
  });
  let repoMeta: { html_url: string; default_branch: string };
  try {
    repoMeta = await ghCreateRepo(repoName);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "github_create_failed";
    await input.onProgress({ type: "failed", message: `Repo create failed (${msg}).` });
    return { ok: false, buildSlug, error: msg };
  }
  const branch = repoMeta.default_branch || "main";

  // 2. Push every file
  await input.onProgress({
    type: "files_pushed",
    message: `Pushing ${Object.keys(files).length} files to the repo.`,
  });
  try {
    for (const [path, content] of Object.entries(files)) {
      await ghPutFile(owner, repoName, path, content, branch);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "github_push_failed";
    await input.onProgress({ type: "failed", message: `Push failed (${msg}).` });
    return { ok: false, buildSlug, error: msg, repoUrl: repoMeta.html_url };
  }

  // 3. Create Vercel project (auto-deploys on link)
  await input.onProgress({
    type: "project_created",
    message: "Linking the deployment platform.",
  });
  let project: VercelProject;
  try {
    project = await vercelCreateProject(buildSlug, owner, repoName);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "vercel_create_failed";
    await input.onProgress({ type: "failed", message: `Project create failed (${msg}).` });
    return {
      ok: false,
      buildSlug,
      error: msg,
      repoUrl: repoMeta.html_url,
    };
  }

  // 4. Poll for ready (max 5 min)
  await input.onProgress({
    type: "deploying",
    message: "Deploying. This usually takes under a minute.",
  });
  const start = Date.now();
  const TIMEOUT_MS = 5 * 60 * 1000;
  let liveUrl: string | undefined;
  let deploymentId: string | undefined;
  while (Date.now() - start < TIMEOUT_MS) {
    await new Promise((r) => setTimeout(r, 4000));
    const dep = await vercelLatestDeployment(project.id);
    if (!dep) continue;
    deploymentId = dep.id;
    if (dep.readyState === "READY") {
      liveUrl = `https://${dep.url}`;
      break;
    }
    if (dep.readyState === "ERROR" || dep.readyState === "CANCELED") {
      await input.onProgress({
        type: "failed",
        message: "Deploy failed on the platform.",
      });
      return {
        ok: false,
        buildSlug,
        error: `deployment_${dep.readyState.toLowerCase()}`,
        repoUrl: repoMeta.html_url,
        vercelProjectId: project.id,
        vercelDeploymentId: deploymentId,
      };
    }
  }

  if (!liveUrl) {
    await input.onProgress({
      type: "failed",
      message: "Deployment didn't finish in time. Repo is ready, deploy may catch up shortly.",
    });
    return {
      ok: false,
      buildSlug,
      error: "deploy_timeout",
      repoUrl: repoMeta.html_url,
      vercelProjectId: project.id,
      vercelDeploymentId: deploymentId,
    };
  }

  await input.onProgress({
    type: "live",
    message: `Live at ${liveUrl}`,
    metadata: { liveUrl, repoUrl: repoMeta.html_url },
  });

  return {
    ok: true,
    buildSlug,
    liveUrl,
    repoUrl: repoMeta.html_url,
    vercelProjectId: project.id,
    vercelDeploymentId: deploymentId,
  };
}
