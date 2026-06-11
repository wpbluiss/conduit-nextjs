# Agent Replication Kit

How to give **any** repo the same autonomous engineering agents that run on
`conduit-nextjs`. Proven here (see PRs #17, #22 — both written by the agent).

The model: a cheap Supabase "fleet" drafts/triages; **Claude Code agents (this kit)
do the real engineering** — read the repo, write code, open PRs you approve from your
phone. They work on **branches + PRs only, never directly on production.**

---

## Per-repo setup (≈3 min)

1. **Claude GitHub App access** — install/configure at `github.com/apps/claude`.
   Easiest: set it to **All repositories** once, so every repo is covered.

2. **Add the API key secret** (phone browser works; the GitHub *app* can't edit secrets):
   `github.com/wpbluiss/<repo>/settings/secrets/actions`
   → New repository secret → name **`ANTHROPIC_API_KEY`** → paste the key.
   *(Later, to run $0 on the Max plan, swap in `CLAUDE_CODE_OAUTH_TOKEN` minted via
   `claude setup-token` from a terminal.)*

3. **Install the two workflow files** below to the repo's **default branch**, then seed
   3–4 `claude-queue` issues describing that repo's most important unfinished work.
   Fastest way: open a Claude Code session on the repo and paste the prompt in
   "Replicating with a session" below.

---

## Replicating with a session (recommended)

Open a Claude Code session **on the target repo** and paste:

> Set up autonomous Claude Code agents on this repo, mirroring `wpbluiss/conduit-nextjs`.
> Copy its `.github/workflows/claude.yml` and `.github/workflows/claude-autopilot.yml`
> (adapt the autopilot prompt's knowledge base + exclusions to THIS codebase), commit to
> the default branch, then create 3–4 `claude-queue` issues for the most important
> unfinished work here. The `ANTHROPIC_API_KEY` secret + Claude GitHub App are set.

---

## The two workflow files

### `.github/workflows/claude.yml` (interactive — @claude in any issue/PR)
```yaml
name: Claude
permissions:
  contents: write
  pull-requests: write
  issues: write
  id-token: write
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  issues:
    types: [opened, assigned]
  pull_request_review:
    types: [submitted]
jobs:
  claude:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### `.github/workflows/claude-autopilot.yml` (scheduled + on-demand, auto-opens PRs)
```yaml
name: Autopilot
permissions:
  contents: write
  pull-requests: write
  issues: write
  id-token: write
on:
  schedule:
    - cron: "0 14 * * *"
  workflow_dispatch: {}
jobs:
  autopilot:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          claude_args: "--max-turns 30"
          prompt: |
            You are this repo's autonomous engineering agent. Founder (Luis) is away;
            you carry the build. Rules (follow exactly):
            1. SCOPE — pick the highest-priority OPEN issue labeled "claude-queue"; if none,
               exit with no changes. One issue per run.
            2. PREMORTEM — before coding, comment on the issue: how could this break the live
               app, leak secrets, cost money, or weaken security? Plan around it. If risky or
               ambiguous, DON'T implement — ask questions and stop.
            3. SAFETY — new branch + PR only, NEVER push to the default branch. Don't touch
               auth/billing/secrets/env unless the issue says so (and flag it loudly).
            4. VERIFY — the repo's build + typecheck/test must pass before opening the PR.
            5. CONTEXT — read CLAUDE.md / AGENTS.md / README / specs as your knowledge base;
               match existing patterns.
            6. HANDOFF — open the PR yourself: push, then `gh pr create --base <default> --fill`
               (gh is authenticated via GITHUB_TOKEN). Link the issue, paste your premortem,
               list what to verify. Keep PRs small + single-purpose (phone-approvable).
```

---

## Safety + cost (non-negotiable)
- Agents **propose** (PRs); they never deploy to prod directly. You approve merges.
- Each repo's agents spend real API tokens — **stagger the rollout** and watch spend
  rather than lighting every repo at once.
- Prove each new repo on one small task before trusting its daily autopilot.

## Priority repos
`conduit-mobile` (Praxis app) · `conduit-hq-unity-scripts` (Unity) · `conduit-backend`
· then the workers (`conduit-engineering-worker`, `conduit-marketing-worker`) and
`conduit-trading-bot`.
