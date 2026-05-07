# Jarvis Reference Audit

Generated 2026-05-07. 197 matches across both repos. **No code was changed** — this is an inventory only. The user picks the new name; rename lands as a separate round.

## Summary

- **Total refs:** 197

- **code constant (ts):** 64
- **code constant (tsx):** 31
- **system prompt:** 18
- **DB seed/migration:** 10
- **comment:** 24
- **docs:** 47
- **other:** 3

## code constant (ts) (64)

### nextjs/src/app/api/conduit/chat/route.ts

| Line | Snippet |
|------|---------|
| 16 | `import type { AccountContext } from "@/lib/ai/employees/jarvis";` |
| 53 | `"jarvis",` |
| 168 | `"jarvis",` |
| 191 | `: "jarvis";` |
| 470 | `? `${baseSystem}\n\n--- Brief from Jarvis ---\n${extraSystem}`` |
| 590 | `employee === "jarvis"` |
| 596 | `employee === "jarvis"` |
| 636 | `written_by: "jarvis",` |
| 696 | `written_by: "jarvis",` |
| 790 | `"jarvis",` |
| 812 | `await runEmployee("jarvis");` |
| 949 | `const baseSystem = systemPromptFor("jarvis", ctx);` |
| 964 | `employee: "jarvis",` |
| 978 | `employee: "jarvis",` |
| 984 | `employee: "jarvis",` |
| 1014 | `content: friendlyErrorFor("jarvis"),` |

### nextjs/src/app/api/conduit/onboarding/route.ts

| Line | Snippet |
|------|---------|
| 5 | `import type { AccountContext } from "@/lib/ai/employees/jarvis";` |
| 96 | `employee: "jarvis",` |
| 139 | `written_by: "jarvis",` |
| 159 | `systemPrompt: withTimeAware(systemPromptFor("jarvis", ctx), {` |
| 163 | `employee: "jarvis",` |
| 177 | `employee: "jarvis",` |
| 183 | `employee: "jarvis",` |
| 215 | `employee: "jarvis",` |
| 217 | `metadata: { fallback: true, reason: friendlyErrorFor("jarvis") },` |

### nextjs/src/app/api/conduit/voice/prefs/route.ts

| Line | Snippet |
|------|---------|
| 7 | `const VALID_EMPLOYEES = ["jarvis", "marketing", "sales", "engineering"];` |

### nextjs/src/app/api/conduit/voice/preview/route.ts

| Line | Snippet |
|------|---------|
| 41 | `const employee = body.employee ?? "jarvis";` |

### nextjs/src/app/api/conduit/voice/tts/route.ts

| Line | Snippet |
|------|---------|
| 37 | `const employee = body.employee ?? "jarvis";` |

### nextjs/src/app/api/voice/memory-write/route.ts

| Line | Snippet |
|------|---------|
| 66 | `written_by: "jarvis",` |

### nextjs/src/app/api/voice/token/route.ts

| Line | Snippet |
|------|---------|
| 74 | `if (!cleaned.includes("jarvis")) cleaned.unshift("jarvis");` |

### nextjs/src/lib/ai/memory.ts

| Line | Snippet |
|------|---------|
| 179 | `export const JARVIS_MEMORY_INSTRUCTIONS = `MEMORY INSTRUCTIONS (Jarvis only):` |

### nextjs/src/lib/ai/parse.ts

| Line | Snippet |
|------|---------|
| 9 | `"jarvis",` |
| 23 | `if (candidate === "jarvis") {` |

### nextjs/src/lib/ai/provider.ts

| Line | Snippet |
|------|---------|
| 8 | `\| "jarvis"` |
| 149 | `jarvis: 800,` |
| 294 | `: "Jarvis";` |

### nextjs/src/lib/ai/roundtable.ts

| Line | Snippet |
|------|---------|
| 73 | `.filter((e) => e !== "jarvis")` |

### nextjs/src/lib/billing/tiers.ts

| Line | Snippet |
|------|---------|
| 34 | `allowedEmployees: ["jarvis", "marketing"],` |
| 44 | `allowedEmployees: ["jarvis", "marketing", "sales", "engineering"],` |
| 56 | `"jarvis",` |

### nextjs/src/lib/conduit/employees.ts

| Line | Snippet |
|------|---------|
| 10 | `\| "jarvis"` |
| 34 | `jarvis: {` |
| 35 | `id: "jarvis",` |
| 36 | `name: "Jarvis",` |
| 137 | `"jarvis",` |
| 153 | `return EMPLOYEES[id as EmployeeId] ?? EMPLOYEES.jarvis;` |

### nextjs/src/lib/conduit/workspace-prompts.ts

| Line | Snippet |
|------|---------|
| 4 | `jarvis: [` |
| 64 | `if (employeeId === "jarvis") {` |

### nextjs/src/lib/voice/config.ts

| Line | Snippet |
|------|---------|
| 82 | `const { data: jarvis } = await supabase` |
| 85 | `.eq("employee", "jarvis")` |
| 88 | `voice_id: (jarvis?.voice_id as string \| null) ?? null,` |
| 89 | `voice_locale: (jarvis?.voice_locale as string) ?? "en-US",` |

### nextjs/src/lib/voice/defaults.ts

| Line | Snippet |
|------|---------|
| 6 | `jarvis: "nPczCjzI2devNBz1zQrb", // Brian — warm British male, COO energy` |
| 35 | `return DEFAULT_EMPLOYEE_VOICES[employee] ?? DEFAULT_EMPLOYEE_VOICES.jarvis;` |
| 40 | `jarvis: "Jarvis",` |

### worker/src/conduit-loader.ts

| Line | Snippet |
|------|---------|
| 152 | `const { data: jarvis } = await supa()` |
| 155 | `.eq("employee", "jarvis")` |
| 157 | `if (jarvis?.voice_id) {` |
| 159 | `voice_id: jarvis.voice_id as string,` |
| 160 | `voice_locale: (jarvis.voice_locale as string) ?? "en-US",` |

### worker/src/system-prompts.ts

| Line | Snippet |
|------|---------|
| 17 | `jarvis: {` |
| 18 | `name: "Jarvis",` |
| 19 | `rolePrompt: `You're Jarvis, the chief of staff. You route work to other employees, hold the bigger picture,...` |
| 83 | `const cfg = EMPLOYEES[args.employeeId] ?? EMPLOYEES.jarvis;` |

## code constant (tsx) (31)

### nextjs/src/app/app/artifacts/page.tsx

| Line | Snippet |
|------|---------|
| 16 | `"jarvis",` |
| 25 | `: "jarvis") as EmployeeKey;` |

### nextjs/src/components/conduit/Chat.tsx

| Line | Snippet |
|------|---------|
| 47 | `dept: "jarvis",` |
| 48 | `hint: "Strategy with Jarvis",` |
| 97 | `(s) => s.dept === "jarvis" \|\| s.dept === "marketing",` |
| 100 | `(s) => s.dept !== "jarvis" && s.dept !== "marketing" && allowed.has(s.dept),` |
| 109 | `{ value: "auto", label: "Jarvis (auto-route)" },` |
| 111 | `{ value: "jarvis", label: "Jarvis only" },` |
| 140 | `allowedEmployees.filter((e) => e !== "jarvis").length >= 2;` |
| 309 | `? "jarvis"` |
| 310 | `: (explicitPin as EmployeeKey \| undefined) ?? "jarvis";` |
| 532 | `if (m.role === "assistant" && m.employee === "jarvis") {` |
| 588 | `content: "Synthesis from Jarvis",` |
| 593 | `employee: "jarvis",` |
| 608 | `m.employee === "jarvis" &&` |
| 620 | `void playTTS(content, "jarvis", i);` |
| 707 | `pinOptions.find((o) => o.value === pin)?.label ?? "Jarvis (auto-route)";` |
| 709 | `pin === "auto" \|\| pin === "team" ? "jarvis" : (pin as EmployeeKey);` |
| 783 | `? "jarvis"` |
| 949 | `Talk to Jarvis. He routes the right employee — or handles it` |
| 1051 | `const employee = (message.employee as EmployeeKey) ?? "jarvis";` |

### nextjs/src/components/conduit/OnboardingModal.tsx

| Line | Snippet |
|------|---------|
| 94 | `This is the name Jarvis and your team will use.` |
| 171 | `Tell Jarvis what you&apos;re working on.` |
| 198 | `Meet Jarvis <ArrowRight size={16} />` |
| 236 | `Briefing Jarvis. Bringing Marketing, Sales, and Engineering` |

### nextjs/src/components/conduit/SettingsTabs.tsx

| Line | Snippet |
|------|---------|
| 143 | `"jarvis",` |
| 422 | `Real-time conversational voice. Speak to Jarvis or your whole team` |
| 599 | `Jarvis writes here when you tell him something durable. You can` |
| 1041 | `const empNames: EmployeeKey[] = ["jarvis", "marketing", "sales", "engineering"];` |

### nextjs/src/components/conduit/Sidebar.tsx

| Line | Snippet |
|------|---------|
| 147 | `dom && (TEAM as string[]).includes(dom) ? dom : "jarvis"` |
| 177 | `"conic-gradient(from 90deg, var(--color-dept-marketing), var(--color-dept-sales), var(--color-dept-engineer...` |

## system prompt (18)

### nextjs/src/lib/ai/employees/compliance.ts

| Line | Snippet |
|------|---------|
| 1 | `import type { AccountContext } from "./jarvis";` |

### nextjs/src/lib/ai/employees/engineering.ts

| Line | Snippet |
|------|---------|
| 1 | `import type { AccountContext } from "./jarvis";` |

### nextjs/src/lib/ai/employees/finance.ts

| Line | Snippet |
|------|---------|
| 1 | `import type { AccountContext } from "./jarvis";` |

### nextjs/src/lib/ai/employees/hr.ts

| Line | Snippet |
|------|---------|
| 1 | `import type { AccountContext } from "./jarvis";` |

### nextjs/src/lib/ai/employees/index.ts

| Line | Snippet |
|------|---------|
| 2 | `import { type AccountContext, jarvisSystemPrompt } from "./jarvis";` |
| 20 | `case "jarvis":` |
| 21 | `return jarvisSystemPrompt(ctx);` |

### nextjs/src/lib/ai/employees/jarvis.ts

| Line | Snippet |
|------|---------|
| 2 | `import { JARVIS_MEMORY_INSTRUCTIONS } from "@/lib/ai/memory";` |
| 15 | `export function jarvisSystemPrompt(ctx: AccountContext): string {` |
| 17 | `"jarvis",` |
| 46 | `return withTone(`You are Jarvis, ${ctx.user_name}'s Chief of Staff at their company ${ctx.account_name}. Th...` |
| 66 | `6. NEVER mention Claude, Anthropic, GPT, or any provider. You are Jarvis. The other employees are also AI b...` |
| 69 | `Style: Confident. Direct. Warm. Slightly British in cadence (the Jarvis from Iron Man — but professional, n...` |
| 71 | `${JARVIS_MEMORY_INSTRUCTIONS}`);` |

### nextjs/src/lib/ai/employees/legal.ts

| Line | Snippet |
|------|---------|
| 1 | `import type { AccountContext } from "./jarvis";` |

### nextjs/src/lib/ai/employees/marketing.ts

| Line | Snippet |
|------|---------|
| 1 | `import type { AccountContext } from "./jarvis";` |

### nextjs/src/lib/ai/employees/ops.ts

| Line | Snippet |
|------|---------|
| 1 | `import type { AccountContext } from "./jarvis";` |

### nextjs/src/lib/ai/employees/sales.ts

| Line | Snippet |
|------|---------|
| 1 | `import type { AccountContext } from "./jarvis";` |

## DB seed/migration (10)

### nextjs/supabase/migrations/005_billing.sql

| Line | Snippet |
|------|---------|
| 22 | `('free', 'Free', 0, 50000, 'haiku', ARRAY['jarvis','marketing'], '{"creator_mode": false}'::jsonb, 1),` |
| 23 | `('pro', 'Pro', 2900, 1000000, 'sonnet', ARRAY['jarvis','marketing','sales','engineering'], '{"creator_mode"...` |
| 24 | `('enterprise', 'Enterprise', 19900, 5000000, 'opus', ARRAY['jarvis','marketing','sales','engineering','fina...` |

### nextjs/supabase/migrations/007_tier_employees_v2.sql

| Line | Snippet |
|------|---------|
| 5 | `SET allowed_employees = ARRAY['jarvis','marketing']` |
| 9 | `SET allowed_employees = ARRAY['jarvis','marketing','sales','engineering']` |
| 14 | `'jarvis','marketing','sales','engineering',` |

### nextjs/supabase/migrations/012_conduit_memory.sql

| Line | Snippet |
|------|---------|
| 2 | `-- Jarvis writes durable records via [REMEMBER] / [SUPERSEDE] tags. Every` |
| 21 | `written_by text NOT NULL DEFAULT 'jarvis',` |

### nextjs/supabase/migrations/014_voice_voices.sql

| Line | Snippet |
|------|---------|
| 90 | `-- falls back to Jarvis's voice for any employee whose voice_id is null.` |
| 92 | `('jarvis',      NULL),` |

## comment (24)

### nextjs/src/app/api/conduit/chat/route.ts

| Line | Snippet |
|------|---------|
| 207 | `// The same intent flows through Jarvis routing → handed-off employee.` |
| 476 | `// non-Jarvis; Jarvis's MEMORY INSTRUCTIONS section is already in the` |
| 593 | `// R10: parse memory writes ONLY from Jarvis. Other employees can't` |
| 811 | `// single Jarvis response.` |
| 946 | `// Synthesis turn — Jarvis only` |

### nextjs/src/app/api/conduit/onboarding/route.ts

| Line | Snippet |
|------|---------|
| 53 | `// Auto-create welcome conversation with a Jarvis greeting` |
| 169 | `// Onboarding always allowed even on Free tier (Jarvis is in the allowlist).` |

### nextjs/src/app/api/voice/memory-write/route.ts

| Line | Snippet |
|------|---------|
| 5 | `// Honors the R10 invariant that Jarvis is the only writer — every row` |
| 6 | `// goes in with written_by='jarvis' regardless of which employee actually` |

### nextjs/src/app/api/voice/token/route.ts

| Line | Snippet |
|------|---------|
| 60 | `// R12.5: validate roundtable mode. Jarvis is always a participant` |

### nextjs/src/components/conduit/Chat.tsx

| Line | Snippet |
|------|---------|
| 95 | `// Always include Jarvis + Marketing first; then fill with others the tier allows.` |
| 138 | `// "team" requires at least 2 non-Jarvis employees on the tier.` |
| 529 | `// Attach to the most recent Jarvis assistant message.` |
| 583 | `// Banner + pending Jarvis bubble` |

### nextjs/src/lib/ai/memory.ts

| Line | Snippet |
|------|---------|
| 3 | `// Jarvis emits structured tags in his text output, the chat route parses` |
| 71 | `* Strip and parse [REMEMBER] / [SUPERSEDE] tags from a Jarvis response.` |
| 175 | `* Append memory-write instructions to Jarvis's system prompt. Only Jarvis` |

### nextjs/src/lib/ai/roundtable.ts

| Line | Snippet |
|------|---------|
| 1 | `// R9 round-table mode — multiple employees respond in parallel, Jarvis` |
| 28 | `*  - Free / Pro tiers max out at 4 (the launch four minus Jarvis = 3, fine)` |
| 29 | `*  - Enterprise / internal: 8 (all 9 minus Jarvis)` |

### nextjs/src/lib/conduit/employees.ts

| Line | Snippet |
|------|---------|
| 3 | `// components, the Jarvis routing prompt, the intent classifier, and the` |

### nextjs/src/lib/voice/config.ts

| Line | Snippet |
|------|---------|
| 46 | `*   3. Jarvis fallback (also from default_voices)` |
| 48 | `* voice_id may still be null at the end if Jarvis hasn't been configured —` |
| 49 | `* the worker handles that by emitting a Jarvis-default-voice ElevenLabs ID` |

## docs (47)

### nextjs/CONDUIT_LOG.md

| Line | Snippet |
|------|---------|
| 19 | `Model assignments: Sonnet 4 for Jarvis + Engineering, Haiku 4.5 for Marketing` |
| 21 | `- `src/lib/ai/employees/{jarvis,marketing,sales,engineering}.ts` — per-employee` |
| 27 | `- `POST /api/conduit/chat` — SSE-streaming. Routes through Jarvis by default,` |
| 34 | `- `POST /api/conduit/onboarding` — saves business fields, generates Jarvis` |
| 65 | `use `friendlyErrorFor(employee)` ("Jarvis is taking a moment, try again").` |
| 104 | `- After the key was added, Jarvis responded successfully at 21:15 (560-char` |
| 111 | `- **Default model swapped to Haiku 4.5 for Jarvis, Marketing, Sales.**` |
| 118 | `- **Per-employee `max_tokens` caps**: Jarvis 800, Marketing 4000, Sales 600,` |
| 146 | `- **Color tokens**: added `--color-dept-{jarvis,marketing,sales,engineering}`` |
| 147 | `+ soft variants. Jarvis silver/platinum, Marketing warm orange (matches` |
| 191 | `Before R2, default Jarvis turn used Sonnet 4 ($3 in / $15 out) with a` |
| 194 | `- Sonnet → Haiku for Jarvis/Marketing/Sales: **input ~67% cheaper, output` |
| 202 | `- Net: a typical 5-turn Jarvis conversation should cost roughly **15–20% of` |
| 205 | `pinned or Jarvis routes there.` |
| 254 | `- Default state: each dot runs an `ambientPulse` keyframe, cycling — Jarvis (delay 0s), Marketing (3s), Sal...` |
| 453 | `\| Free \| $0 \| 50k \| Haiku \| Jarvis + Marketing \|` |
| 509 | `(Brian / Sarah / Adam / Josh for Jarvis / Marketing / Sales /` |
| 619 | `panel), Jarvis routing prompt, intent classifier, tier allowlist, and` |
| 637 | `### Jarvis routing update` |
| 640 | `employees + Jarvis self-handle. Jarvis also receives` |
| 642 | `locks an employee, Jarvis self-handles instead of emitting a HANDOFF,` |
| 678 | `best for the account's allowed employees, always prioritising Jarvis +` |
| 679 | `Marketing. Free sees Jarvis + Marketing + 2 fallbacks (still Marketing-` |
| 703 | `- Migration 007 applied; tier rows confirmed: Free [jarvis, marketing],` |
| 704 | `Pro [jarvis, marketing, sales, engineering], Enterprise [all 9].` |
| 898 | `Jarvis gets "You haven't checked in with me yet…", canExecute employees` |
| 926 | `- Free: Jarvis + Marketing workspaces accessible.` |
| 992 | `5. After all done, fire one Jarvis `complete()` with `synthesisBrief()`` |
| 1002 | `- After all done, a `Synthesis from Jarvis` banner + Jarvis's bubble.` |
| 1005 | `Josh, Jarvis in Brian. Per-employee voice mapping was already` |
| 1014 | `emerald → Engineering blue → Jarvis silver) — visually communicates` |
| 1018 | `- Falls back to Jarvis silver if the column is null.` |
| 1128 | `Same convention as `[HANDOFF]` / `[ARTIFACT]`. Jarvis (and only Jarvis)` |
| 1136 | `chat route only runs the parser when `employee === 'jarvis'` — other` |
| 1137 | `employees can't mutate memory even if they emit the tags. Jarvis's` |
| 1138 | `system prompt now carries a `JARVIS_MEMORY_INSTRUCTIONS` block` |
| 1159 | `After Jarvis's text streams in, the chat route:` |
| 1171 | `message_id of the Jarvis turn that produced it. The memory row` |
| 1208 | `length, persists (`written_by='jarvis'`). Idempotent: skips if the` |
| 1218 | `Streamed `memory_written` events attach to the latest Jarvis bubble` |
| 1278 | `Railway. Verified live by Luis: Jarvis voice ID` |
| 1314 | `unlimited internal), forces Jarvis as moderator, blocks tier-locked` |

### nextjs/SESSION_HANDOFF_2026-05-06.md

| Line | Snippet |
|------|---------|
| 6 | `- Last round: R10 (cross-conversation memory layer). Tested live — Jarvis remembers Lunaro partnership cont...` |
| 19 | `- R10: cross-conversation memory (tag-based [REMEMBER]/[SUPERSEDE] tools, Jarvis-only writer, all-employee ...` |
| 48 | `Voice ID Jarvis = UgBBYS2sOqTuMpoF3BR0 (Mark - Natural Conversations),` |
| 78 | `- Memory: Jarvis is only writer, all employees read-only` |

### nextjs/docs/voice-picks.md

| Line | Snippet |
|------|---------|
| 10 | `\| jarvis       \| Mark – Natural Conversations    \| `UgBBYS2sOqTuMpoF3BR0`    \| (Pre-seeded.) Casual you...` |

## other (3)

### nextjs/src/app/globals.css

| Line | Snippet |
|------|---------|
| 20 | `Jarvis = silver/platinum (chief of staff)` |
| 24 | `--color-dept-jarvis: #C8C5BD;` |
| 25 | `--color-dept-jarvis-soft: rgba(200, 197, 189, 0.14);` |

## Rename guidance (when the new name is picked)

Order of operations to avoid a half-renamed prod:

1. **DB first** — update  row (rename the  key only if the union changes; otherwise leave). Update  arrays.
2. **Code constant union** —   type. This is the canonical employee-id list; every union/const flows from here.
3. **System prompts** — rename  and update its function name + the  import paths in the other 8 employee files.
4. **Worker repo** —  EMPLOYEES record,  references.
5. **UI strings + display labels** — Chat.tsx, Sidebar, anywhere the visible name is rendered.
6. **Migrations** — DO NOT rewrite past migration SQL. Add a new migration that updates seed rows in place.
7. **Memory writes** — R10 memory has rows with . Decide whether to keep the historical attribution string or rename in place.
8. **Docs** — CONDUIT_LOG.md, SESSION_HANDOFF, briefs/. Find-replace pass at the end.

## Refs intentionally NOT touched in a rename

-  tables in Supabase — those belong to a different project (workforce / Lunaro), unrelated to Conduit. Confirmed during audit by RLS state + table prefixes.
- This file () — historical record.