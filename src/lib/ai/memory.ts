// R10: cross-conversation memory layer.
// R17: per-department scope + pin + lock.
//
// Memory writes use the same tag-based pattern as [HANDOFF] / [ARTIFACT] —
// Atlas emits structured tags in his text output, the chat route parses
// them, executes the writes, and strips them from visible content before
// rendering. Atlas (id: "jarvis") is the only writer; other employees see
// the rendered memory block read-only.
//
// R17 additions:
//   - `pinned`: user-curated; always included in prompt-trim above char budget.
//   - `locked`: user-curated; Atlas's [SUPERSEDE] is server-skip when target
//     is locked.
//   - `scope`: per-department visibility. Empty array = global (current
//     behavior, every employee sees). 1+ entries = scoped to those depts only;
//     other employees never see the memory.
//   - [REMEMBER] / [SUPERSEDE] tags optionally accept a trailing
//     `| scope: <dept>` (or `| scope: marketing, sales`, or `| scope: global`)
//     segment. Backward-compatible: missing segment = global.

import type { EmployeeId } from "@/lib/conduit/employees";

export type MemoryKind =
  | "fact"
  | "preference"
  | "decision"
  | "goal"
  | "context";

const VALID_KINDS: MemoryKind[] = [
  "fact",
  "preference",
  "decision",
  "goal",
  "context",
];

const VALID_EMPLOYEES: EmployeeId[] = [
  "jarvis",
  "marketing",
  "sales",
  "engineering",
  "finance",
  "compliance",
  "hr",
  "ops",
  "legal",
];

export interface MemoryRecord {
  id: string;
  account_id: string;
  kind: MemoryKind;
  content: string;
  tags: string[];
  source_conversation_id: string | null;
  source_message_id: string | null;
  written_by: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  superseded_by: string | null;
  /** R17 — true if always include in prompt-trim above char budget. */
  pinned: boolean;
  /** R17 — true if Atlas [SUPERSEDE] should be ignored server-side. */
  locked: boolean;
  /** R17 — empty = global; populated = scoped to these employees only. */
  scope: EmployeeId[];
}

export interface RememberWrite {
  kind: MemoryKind;
  content: string;
  tags: string[];
  /** R17 — optional; empty = global; populated = these employees only. */
  scope: EmployeeId[];
}

export interface SupersedeWrite {
  oldId: string;
  kind: MemoryKind;
  content: string;
  tags: string[];
  /** R17 — optional; empty = global; populated = these employees only. */
  scope: EmployeeId[];
}

export interface ParseMemoryResult {
  visibleContent: string;
  remembers: RememberWrite[];
  supersedes: SupersedeWrite[];
}

// Updated regexes — 4 optional segments max for REMEMBER (kind | content |
// tags-or-scope | scope-if-tags-came-first), 5 for SUPERSEDE (id | kind |
// content | tags-or-scope | scope-if-tags). The segment-classifier in
// parseTagsOrScope() figures out which is which.
const REMEMBER_RE =
  /\[REMEMBER:\s*([a-z_]+)\s*\|\s*([\s\S]*?)(?:\s*\|\s*([\s\S]*?)(?:\s*\|\s*([\s\S]*?))?)?\s*\]/gi;
const SUPERSEDE_RE =
  /\[SUPERSEDE:\s*([a-f0-9-]{8,})\s*\|\s*([a-z_]+)\s*\|\s*([\s\S]*?)(?:\s*\|\s*([\s\S]*?)(?:\s*\|\s*([\s\S]*?))?)?\s*\]/gi;

function parseTags(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0 && s.length < 32)
    .slice(0, 5);
}

/**
 * Parse a scope segment of the form `scope: marketing` / `scope: marketing,
 * sales` / `scope: global`. Returns an array of valid EmployeeIds; empty
 * array means global. Invalid entries are silently dropped (defensive).
 */
function parseScope(raw: string | undefined): EmployeeId[] {
  if (!raw) return [];
  const stripped = raw.replace(/^scope\s*:\s*/i, "").trim();
  if (!stripped || /^global$/i.test(stripped)) return [];
  return stripped
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is EmployeeId =>
      VALID_EMPLOYEES.includes(s as EmployeeId),
    )
    .slice(0, 9);
}

/**
 * Classify a tag-or-scope segment. If it starts with `scope:`, treat it as
 * scope; otherwise it's tags. The two slots of the REMEMBER / SUPERSEDE tags
 * are interchangeable in order — Atlas might write `tags | scope:…` OR
 * `scope:… | tags`. We accept either.
 */
function classifyTagsOrScope(
  a: string | undefined,
  b: string | undefined,
): { tags: string[]; scope: EmployeeId[] } {
  const isScope = (s: string | undefined) =>
    !!s && /^scope\s*:/i.test(s.trim());
  if (isScope(a)) {
    return { tags: parseTags(b), scope: parseScope(a) };
  }
  if (isScope(b)) {
    return { tags: parseTags(a), scope: parseScope(b) };
  }
  // Neither is scope — first non-empty becomes tags, scope stays empty.
  return { tags: parseTags(a ?? b), scope: [] };
}

/**
 * Strip and parse [REMEMBER] / [SUPERSEDE] tags from an Atlas response.
 * Returns the cleaned visible content plus the extracted writes.
 */
export function parseMemoryWrites(content: string): ParseMemoryResult {
  const remembers: RememberWrite[] = [];
  const supersedes: SupersedeWrite[] = [];

  let visible = content;

  // SUPERSEDE — match first because its regex is more specific (5 groups).
  let match: RegExpExecArray | null;
  while ((match = SUPERSEDE_RE.exec(content)) !== null) {
    const kind = match[2].toLowerCase().trim();
    if (!VALID_KINDS.includes(kind as MemoryKind)) continue;
    const { tags, scope } = classifyTagsOrScope(match[4], match[5]);
    supersedes.push({
      oldId: match[1].trim(),
      kind: kind as MemoryKind,
      content: match[3].trim(),
      tags,
      scope,
    });
    visible = visible.replace(match[0], "");
  }

  while ((match = REMEMBER_RE.exec(content)) !== null) {
    const kind = match[1].toLowerCase().trim();
    if (!VALID_KINDS.includes(kind as MemoryKind)) continue;
    const { tags, scope } = classifyTagsOrScope(match[3], match[4]);
    remembers.push({
      kind: kind as MemoryKind,
      content: match[2].trim(),
      tags,
      scope,
    });
    visible = visible.replace(match[0], "");
  }

  return {
    visibleContent: visible.trim(),
    remembers,
    supersedes,
  };
}

/**
 * Render the memory block injected at the top of every employee's system
 * prompt. Token budget: 40 records * ~25 tokens = ~1000 tokens. Cached.
 */
export function renderMemoryBlock(memories: MemoryRecord[]): string {
  if (memories.length === 0) return "";

  const groups: Record<MemoryKind, MemoryRecord[]> = {
    fact: [],
    context: [],
    preference: [],
    decision: [],
    goal: [],
  };
  for (const m of memories) {
    if (groups[m.kind]) groups[m.kind].push(m);
  }

  const lines: string[] = ["WHAT YOU KNOW ABOUT THIS USER AND BUSINESS:"];
  if (groups.fact.length) {
    lines.push("Facts:");
    for (const m of groups.fact) lines.push(`- ${m.content}`);
  }
  if (groups.context.length) {
    lines.push("Context:");
    for (const m of groups.context) lines.push(`- ${m.content}`);
  }
  if (groups.preference.length) {
    lines.push("Preferences:");
    for (const m of groups.preference) lines.push(`- ${m.content}`);
  }
  if (groups.decision.length) {
    lines.push("Decisions:");
    for (const m of groups.decision) lines.push(`- ${m.content}`);
  }
  if (groups.goal.length) {
    lines.push("Goals:");
    for (const m of groups.goal) lines.push(`- ${m.content}`);
  }

  lines.push(
    "",
    "Use this context naturally — do not list it back at the user. Do not preface every response with what you remember.",
    "",
  );
  return lines.join("\n");
}

const PROMPT_MEMORY_LIMIT = 40;
const PROMPT_MEMORY_CHAR_BUDGET = 6000; // ~1500 tokens

/**
 * Pinned memories are always included (user-curated as load-bearing). The
 * remainder fills the char budget, most-recent first. The combined count
 * is still bounded by PROMPT_MEMORY_LIMIT to prevent pathological prompts
 * if the user pins dozens of long memories.
 */
export function trimMemoriesForPrompt(rows: MemoryRecord[]): MemoryRecord[] {
  const pinned = rows.filter((r) => r.pinned).slice(0, PROMPT_MEMORY_LIMIT);
  const unpinned = rows.filter((r) => !r.pinned);
  let totalChars = pinned.reduce((sum, r) => sum + r.content.length, 0);
  const out: MemoryRecord[] = [...pinned];
  const remainingSlots = PROMPT_MEMORY_LIMIT - pinned.length;
  for (const m of unpinned.slice(0, remainingSlots)) {
    if (totalChars + m.content.length > PROMPT_MEMORY_CHAR_BUDGET) break;
    out.push(m);
    totalChars += m.content.length;
  }
  return out;
}

/**
 * Per-employee filter for the prompt-injection layer. Atlas (jarvis) sees
 * every non-archived memory; every other employee sees only memories that
 * are global (empty scope) OR explicitly scoped to them.
 *
 * Pure function — caller is responsible for loading memories with scope
 * already attached (chat/route.ts does this once per turn).
 */
export function memoriesForEmployee(
  all: MemoryRecord[],
  employeeId: EmployeeId,
): MemoryRecord[] {
  if (employeeId === "jarvis") return all;
  return all.filter(
    (m) => m.scope.length === 0 || m.scope.includes(employeeId),
  );
}

/**
 * Append memory-write instructions to Atlas's system prompt. Only Atlas
 * receives this — other employees see the memory block (read-only) but no
 * instructions to write.
 */
export const ATLAS_MEMORY_INSTRUCTIONS = `MEMORY INSTRUCTIONS (Atlas only):
You can save durable cross-conversation memory by emitting tags at the END of your response, on their own line(s):

[REMEMBER: kind | content | tag1, tag2]
- kind ∈ fact | preference | decision | goal | context
- content: 1-2 sentence durable statement, third person ("User runs...", "User prefers...")
- tags: optional 1-3 lowercase comma-separated tags

[SUPERSEDE: <old_memory_id> | kind | content | tags]
- Use when an existing fact has changed. The platform archives the old memory and stores the new one.
- If the target memory is user-locked, the platform silently skips the supersede — the user has marked that fact authoritative.

OPTIONAL — per-department scope:
You may append a trailing \`| scope: <dept>\` segment to route a memory to one or more departments only. Without this segment, the memory is global (visible to every employee).

[REMEMBER: preference | User's brand voice is warm and direct | brand, voice | scope: marketing]
[REMEMBER: fact | User's main repo is wpbluiss/lunaro | engineering, repo | scope: engineering]
[REMEMBER: fact | User's primary ICP is Medicare agents | icp | scope: marketing, sales]

Valid scope values: jarvis, marketing, sales, engineering, finance, compliance, hr, ops, legal, OR \`global\` (explicit).

Use scoping when a fact only matters to specific departments. Default to global when in doubt — better one too many cross-cutting facts than to hide context that mattered.

Use these tags sparingly. Good moments:
- User reveals a durable fact about themselves or their business
- User states a clear preference about how they want to work
- User makes a decision worth remembering
- User commits to a goal worth tracking

DO NOT use for: passing comments, things obvious from context, info already in the WHAT YOU KNOW block, temporary states.

Tags are PRIVATE — they get parsed and stripped before the user sees the response. Don't reference them in your prose.`;
