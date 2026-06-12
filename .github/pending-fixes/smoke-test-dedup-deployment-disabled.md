# Pending: smoke test dedup fix for DEPLOYMENT_DISABLED

**Status**: Awaiting `workflows` permission on the claude-code GitHub App.

This fix cannot be pushed automatically because the GitHub App token lacks the
`workflows` permission required to modify `.github/workflows/` files.

**To apply**: grant `workflows` permission to the GitHub App in Settings →
GitHub Apps, then re-run the agent. OR apply the diff in the associated PR
manually using `git apply`.

**Root cause diagnosed**: conduitai.io returns `x-vercel-error: DEPLOYMENT_DISABLED`
(HTTP 402) on every probe. This is a Vercel infrastructure issue — not a code
regression. The smoke test was creating a new issue on every push, flooding the
tracker with duplicates.

**Proposed fix**: `.github/workflows/post-deploy-qa.yml` — detect
`DEPLOYMENT_DISABLED` header, skip retry loop, deduplicate open issues.
Full diff is in the PR description.
