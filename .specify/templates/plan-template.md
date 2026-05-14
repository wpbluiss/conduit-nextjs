# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]

**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]

**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]

**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]

**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]

**Project Type**: [e.g., library/cli/web-service/mobile-app/compiler/desktop-app or NEEDS CLARIFICATION]

**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]

**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]

**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

For each gate, record **pass / fail / N/A** with a one-line justification. A
**fail** blocks Phase 0 until either the plan is revised or the violation is
recorded in **Complexity Tracking** below with an explicit waiver and a
rejected simpler alternative.

| # | Principle | Gate question | Verdict |
|---|-----------|---------------|---------|
| 0 | Domain Truth & No Hallucination | Does this plan introduce or rely on Praxis/Conduit AI product domain content — employees, capabilities, pricing tiers, customer logos, integration claims, or terminology (Jarvis, Praxis, voice room, build, artifact, round identifier `R<N>.<M>`)? If yes, cite the source for every domain decision in source-authority order (latest applicable `SESSION_REPORT_YYYY-MM-DD_*.md`, then active `briefs/CONDUIT_BRIEF_*.md`, then `STRATEGY.md`). Unsourced items MUST be flagged **NEEDS CLARIFICATION**, not guessed. If no domain content is introduced, mark **N/A**. | |
| I | Next.js 16 Source-of-Truth | Does this plan touch Next.js APIs, file conventions, framework behavior, caching, routing, server actions, server components, or middleware? If yes, list the specific `node_modules/next/dist/docs/` guides consulted before authoring the plan, and confirm any middleware references use `src/proxy.ts` exporting `proxy(request)` — never `src/middleware.ts`. Deprecation notices surfaced during work MUST be addressed in the same PR or filed as tracked TODOs. If no framework concerns are touched, mark **N/A**. | |
| II | Schema Namespacing & Tenant Boundary | Does this plan add or modify Supabase tables, functions, or views? If yes, all new tables MUST be named `conduit_<name>` and ship with `ENABLE ROW LEVEL SECURITY` plus at least one policy in the creating migration. Any read/write from non-`conduit_*` schemas (`auth.users`, `storage.*`, or anything `lunaro_*`) MUST be named and justified — cross-tenant `lunaro_*` reads are forbidden. If no schema changes, mark **N/A**. | |
| III | Brand Integrity & Provider Concealment | Does this plan surface AI-generated content, error messages, debug output, page metadata, or any client-visible UI? If yes, confirm: (a) no "Claude"/"Anthropic"/"OpenAI" strings appear outside `src/lib/ai/provider.ts` and its callers; (b) LLM output is scrubbed of provider-tells at the prompt layer, not the display; (c) marketing routes render "Conduit AI" wordmark + parent-brand tokens, `/app/*` routes render "Praxis" wordmark + in-app tokens — no cross-contamination in components, copy, or page metadata. If no client-visible surface is added, mark **N/A**. | |
| IV | Dual-Brand Single-Deploy | Does this plan add or modify route files or components? If yes, confirm: marketing routes (`/`, `/about`, `/approach`, `/careers`, `/changelog`, `/customers`, `/engineering`, `/pricing`, `/products`, `/trust`) do NOT import from `/app/*` or `src/components/conduit/`; `/app/*` routes do NOT import marketing landing components (`Hero.tsx`, `Footer.tsx`, `Navbar.tsx`); shared primitives live in `src/components/design-system/` only when brand-neutral. Edits to the `src/proxy.ts` matcher MUST document the session-refresh impact on every `/app/*` surface. If no route/component changes, mark **N/A**. | |
| V | Verification by Preview + Mobile Sweep | What is the verification plan? List: (a) the Vercel preview URL that exercises the affected surface in-browser; (b) the 375px and 390px mobile sweep plan for any UI change; (c) for voice/realtime changes, the LiveKit-room end-to-end exercise plan; (d) whether this qualifies as a material milestone (new surface, ≥3-table migration, brand rollout, voice/realtime change, billing/entitlement change, or round-numbered `R<N>.<M>` increment) requiring a dated `SESSION_REPORT_YYYY-MM-DD_<scope>.md`. "It built" is not sufficient. | |
| VI | Push-to-Main | Will this feature ship via `git push` to `main` (or a short-lived feature branch merged fast-forward into `main`)? Confirm no long-running branch is implied by the plan's phasing, and that preview verification runs on Vercel preview deploys per Principle V. Any anticipated manual `vercel --prod` recovery deploy MUST be justified under **Complexity Tracking** below. | |

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
