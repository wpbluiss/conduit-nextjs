// R10: cross-conversation memory layer.
// Memory writes use the same tag-based pattern as [HANDOFF] / [ARTIFACT] —
// Atlas emits structured tags in his text output, the chat route parses
// them, executes the writes, and strips them from visible content before
// rendering. Atlas (id: "jarvis") is the only writer; other employees see
// the rendered memory block read-only.

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
}

export interface RememberWrite {
  kind: MemoryKind;
  content: string;
  tags: string[];
}

export interface SupersedeWrite {
  oldId: string;
  kind: MemoryKind;
  content: string;
  tags: string[];
}

export interface ParseMemoryResult {
  visibleContent: string;
  remembers: RememberWrite[];
  supersedes: SupersedeWrite[];
}

const REMEMBER_RE =
  /\[REMEMBER:\s*([a-z_]+)\s*\|\s*([\s\S]*?)(?:\s*\|\s*([\s\S]*?))?\s*\]/gi;
const SUPERSEDE_RE =
  /\[SUPERSEDE:\s*([a-f0-9-]{8,})\s*\|\s*([a-z_]+)\s*\|\s*([\s\S]*?)(?:\s*\|\s*([\s\S]*?))?\s*\]/gi;

function parseTags(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0 && s.length < 32)
    .slice(0, 5);
}

/**
 * Strip and parse [REMEMBER] / [SUPERSEDE] tags from an Atlas response.
 * Returns the cleaned visible content plus the extracted writes.
 */
export function parseMemoryWrites(content: string): ParseMemoryResult {
  const remembers: RememberWrite[] = [];
  const supersedes: SupersedeWrite[] = [];

  let visible = content;

  // SUPERSEDE — match first because the regex has 4 groups vs 3 for REMEMBER.
  let match: RegExpExecArray | null;
  while ((match = SUPERSEDE_RE.exec(content)) !== null) {
    const kind = match[2].toLowerCase().trim();
    if (!VALID_KINDS.includes(kind as MemoryKind)) continue;
    supersedes.push({
      oldId: match[1].trim(),
      kind: kind as MemoryKind,
      content: match[3].trim(),
      tags: parseTags(match[4]),
    });
    visible = visible.replace(match[0], "");
  }

  while ((match = REMEMBER_RE.exec(content)) !== null) {
    const kind = match[1].toLowerCase().trim();
    if (!VALID_KINDS.includes(kind as MemoryKind)) continue;
    remembers.push({
      kind: kind as MemoryKind,
      content: match[2].trim(),
      tags: parseTags(match[3]),
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

export function trimMemoriesForPrompt(rows: MemoryRecord[]): MemoryRecord[] {
  let totalChars = 0;
  const out: MemoryRecord[] = [];
  for (const m of rows.slice(0, PROMPT_MEMORY_LIMIT)) {
    if (totalChars + m.content.length > PROMPT_MEMORY_CHAR_BUDGET) break;
    out.push(m);
    totalChars += m.content.length;
  }
  return out;
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

Use these sparingly. Good moments:
- User reveals a durable fact about themselves or their business
- User states a clear preference about how they want to work
- User makes a decision worth remembering
- User commits to a goal worth tracking

DO NOT use for: passing comments, things obvious from context, info already in the WHAT YOU KNOW block, temporary states.

Tags are PRIVATE — they get parsed and stripped before the user sees the response. Don't reference them in your prose.`;
