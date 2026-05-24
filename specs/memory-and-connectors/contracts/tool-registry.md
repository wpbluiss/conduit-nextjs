# Contract — Tool Registry + Agentic Loop (Slice 2)

**Spec FRs**: FR-017 … FR-023
**Files**: `src/lib/connectors/{registry,tool-runtime,github/tools}.ts`, `src/lib/ai/provider.ts`, `src/app/api/conduit/chat/route.ts`

This is the load-bearing architecture contract. The tool-calling work is
the biggest risk in the plan; this document is where it gets pinned.

---

## 1. Registry contract

```ts
// src/lib/connectors/registry.ts
import type { EmployeeId } from "@/lib/conduit/employees";
import type { ToolDefinition } from "./tool-runtime";
import { githubTools } from "./github/tools";

export interface ConnectorEntry {
  kind: "github";       // extends with future kinds
  displayName: string;  // "GitHub"
  // Default employees granted on first-connect.
  defaultGrants: EmployeeId[];
  // Tools this connector exposes (filtered per-grant at call time).
  tools: ToolDefinition[];
}

export const CONNECTOR_REGISTRY: ConnectorEntry[] = [
  {
    kind: "github",
    displayName: "GitHub",
    defaultGrants: ["engineering"],
    tools: githubTools,
  },
];
```

---

## 2. Tool definition

```ts
export interface ToolDefinition<TArgs = unknown, TResult = unknown> {
  /** Tool name surfaced to Anthropic. */
  name: string;
  /** Anthropic-facing description; 1-2 sentences. */
  description: string;
  /** JSON Schema per Anthropic tool format. */
  inputSchema: object;
  /** Which connector kind this tool requires. */
  connectorKind: ConnectorKind;
  /** Implementation. Receives parsed args + per-call ctx. */
  run(args: TArgs, ctx: ToolContext): Promise<TResult>;
}

export interface ToolContext {
  accountId: string;
  employeeId: EmployeeId;
  connectorId: string;
  /** Lazy decrypt — SQL roundtrip per call. */
  getCredential(): Promise<string>;
}
```

---

## 3. Per-employee tool filtering

`getToolsForEmployee(accountId, employeeId)`:
1. Query `conduit_connector_grants` JOIN `conduit_connectors` for connectors granted to `employeeId` on `accountId`.
2. For each granted connector, include all `tools` from the matching registry entry.
3. Return the flat array of `ToolDefinition`s.

Result: Engineering with GitHub granted → `[readRepoFile, listRepoFiles, searchRepo]`. Marketing without GitHub → `[]`.

---

## 4. Provider abstraction extension

`src/lib/ai/provider.ts` extends:

```ts
export interface CompletionRequest {
  messages: Message[];
  systemPrompt: string;
  maxTokens?: number;
  metadata?: { … };
  /** NEW Slice 2 — passed through to Anthropic tools field. */
  tools?: AnthropicToolSpec[];
}

export interface CompletionResponse {
  /** Final assistant text after the agentic loop settles. */
  content: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  provider: "anthropic";
  model: string;
  /** NEW Slice 2 — tool calls executed during the loop. */
  toolCalls?: ToolCallRecord[];
}

export interface ToolCallRecord {
  toolName: string;
  args: unknown;
  result: unknown;
  error?: string;
  durationMs: number;
}
```

For `streamComplete`, the generator yields:
- Text deltas (existing): `{ delta: string }`.
- NEW tool-call lifecycle events: `{ toolCall: { phase: "start"|"end", name, args?, result?, error? } }`.
- Final usage (existing): `{ done: true, inputTokens, outputTokens, … }`.

---

## 5. Agentic loop (chat route)

```ts
// Pseudocode for the new loop in chat/route.ts
const MAX_TOOL_TURNS = 5;

const tools = await getToolsForEmployee(account.id, employeeId);
const anthropicTools = tools.map(toolToAnthropicSpec);

let messages = [...existingMessages];
let toolCalls: ToolCallRecord[] = [];
let assistantContent = "";

for (let turn = 0; turn <= MAX_TOOL_TURNS; turn++) {
  const stream = await provider.streamComplete({
    messages,
    systemPrompt,
    tools: anthropicTools,
    // …
  });

  // Accumulate content + tool_use blocks from the stream.
  const result = await accumulateStream(stream, { onDelta, onToolStart, onToolEnd });

  if (result.toolUses.length === 0) {
    // No tool calls this turn — final assistant response.
    assistantContent = result.text;
    break;
  }

  if (turn === MAX_TOOL_TURNS) {
    // Hit limit — force final text-only turn.
    messages = [...messages, { role: "assistant", content: result.text }, {
      role: "user",
      content: "Based on what you've gathered, answer the user directly. No more tools.",
    }];
    continue;
  }

  // Execute each tool, send tool_result back.
  const toolResults = await Promise.all(result.toolUses.map(async (use) => {
    const tool = tools.find(t => t.name === use.name)!;
    const ctx = makeToolContext({ accountId, employeeId, connectorId: tool.connectorId });
    const t0 = Date.now();
    try {
      const out = await tool.run(use.args, ctx);
      toolCalls.push({ toolName: use.name, args: use.args, result: out, durationMs: Date.now() - t0 });
      return { tool_use_id: use.id, content: JSON.stringify(out) };
    } catch (err) {
      const error = (err as Error).message;
      toolCalls.push({ toolName: use.name, args: use.args, result: null, error, durationMs: Date.now() - t0 });
      return { tool_use_id: use.id, content: `Error: ${error}` };
    }
  }));

  messages = [
    ...messages,
    { role: "assistant", content: result.assistantBlocks /* preserves tool_use blocks */ },
    { role: "user", content: toolResults.map(tr => ({ type: "tool_result", tool_use_id: tr.tool_use_id, content: tr.content })) },
  ];
}

// Persist toolCalls into conduit_messages.metadata for replay.
```

---

## 6. GitHub tools (Slice 2.B)

### 6.1 `readRepoFile`

```ts
{
  name: "readRepoFile",
  description: "Read the contents of a single file from a GitHub repository the user has connected. Use when you need to know what's in a specific file.",
  inputSchema: {
    type: "object",
    properties: {
      owner: { type: "string", description: "GitHub username or organization name." },
      repo: { type: "string", description: "Repository name." },
      path: { type: "string", description: "Path to the file from the repo root." },
      ref: { type: "string", description: "Optional branch, tag, or commit SHA. Defaults to default branch.", nullable: true },
    },
    required: ["owner", "repo", "path"],
  },
  connectorKind: "github",
  run: async ({ owner, repo, path, ref }, ctx) => {
    const token = await ctx.getCredential();
    const octokit = new Octokit({ auth: token });
    const res = await octokit.repos.getContent({ owner, repo, path, ref });
    // Handle directory vs file; cap content size to ~30KB.
    if (Array.isArray(res.data)) throw new Error("Path is a directory, not a file. Use listRepoFiles.");
    if (res.data.type !== "file") throw new Error(`Path is a ${res.data.type}, not a file.`);
    const content = Buffer.from(res.data.content, "base64").toString("utf8");
    if (content.length > 30_000) {
      return { path, content: content.slice(0, 30_000), truncated: true, totalLength: content.length };
    }
    return { path, content, truncated: false };
  },
}
```

### 6.2 `listRepoFiles`

```ts
{
  name: "listRepoFiles",
  description: "List files in a directory of a connected GitHub repository.",
  inputSchema: {
    type: "object",
    properties: {
      owner: { type: "string" },
      repo: { type: "string" },
      path: { type: "string", description: "Directory path, or empty string for repo root." },
      ref: { type: "string", nullable: true },
    },
    required: ["owner", "repo", "path"],
  },
  …
}
```

### 6.3 `searchRepo`

```ts
{
  name: "searchRepo",
  description: "Search for a string across files in a connected GitHub repository. Returns matching file paths and snippets.",
  inputSchema: {
    type: "object",
    properties: {
      owner: { type: "string" },
      repo: { type: "string" },
      query: { type: "string", description: "Search string (GitHub code-search syntax supported)." },
    },
    required: ["owner", "repo", "query"],
  },
  …
}
```

---

## 7. Chat-UI tool-call pills

Tool-call events surface in the chat UI as inline pills between assistant
turns:

- Pending: `🔧 Engineering is reading wpbluiss/conduit-nextjs · src/lib/ai/memory.ts…`
- Success: `📄 Read wpbluiss/conduit-nextjs · src/lib/ai/memory.ts (200 lines)`
- Failure: `⚠️ Couldn't read wpbluiss/conduit-nextjs · src/lib/ai/memory.ts (404 — file not found)`

Pills render server-side from `conduit_messages.metadata.toolCalls` on
conversation history replay.

Provider-tell scrubbing (Constitution III) applies to any string the
model produces inside tool args that echoes provider names (rare but
possible).

---

## 8. Failure modes + recovery

| Failure | Behavior |
|---|---|
| Tool execution throws | Captured in `toolCalls[].error`; serialized as `Error: <message>` and returned as the tool_result content. The model continues the loop and typically apologizes. |
| All 5 turns exhausted | Force a final text-only turn ("Based on what you've gathered, answer."). Final assistant content includes a "(reached tool limit)" attribution pill. |
| Credential decrypt fails | Connector marked `status='error'`, `last_error='credential_decrypt_failed'`. Tool throws. User sees `Reconnect required` on next chat turn. |
| Octokit 401/403 | Connector auto-flips to `status='reconnect_required'`. Tool throws. Chat surfaces translated error pointing to `/app/connectors`. |
| Octokit 5xx | Tool throws with `GitHub is having a moment, try again.` Connector stays connected. |

---

## 9. Performance budget

- Single tool call: ≤ 1.5s p95 (Anthropic + Octokit roundtrip).
- 5-tool agentic loop: ≤ 8s p95 (5 × 1.5s + Anthropic latency between turns).
- Streamed UX target: first text byte to user ≤ 800ms (matches existing chat).

---

## 10. Out of scope for Slice 2

- Tool-result caching (e.g., remember the result of `listRepoFiles('/src')` across turns).
- Streaming inside tools (tool results are atomic).
- Tool-level grants beyond per-(connector, employee).
- Tool-call confirmation UI (user pre-approval before execution).
- Anthropic tool-choice forcing (e.g., "must call this tool").

These are P2+ if they ever come up.
