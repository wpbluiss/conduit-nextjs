# Contract — Memory Desk (Slice 1)

**Path**: `/app/memory`
**File**: `src/app/app/memory/page.tsx` (server component) + client components under `src/components/conduit/memory/`
**Spec FRs**: FR-001 … FR-011

---

## 1. URL contract

- **Canonical**: `/app/memory`
- **Backward-compat**: `/app/settings/memory` → server-side `redirect("/app/memory")`.
- **Auth**: standard `getCurrentAccount()` redirect to `/auth/sign-in?next=/app/memory` if not signed in.

---

## 2. Server-render contract

Page component shape:

```ts
// src/app/app/memory/page.tsx
export const dynamic = "force-dynamic";

export default async function MemoryPage() {
  const current = await getCurrentAccount();
  if (!current) redirect("/auth/sign-in?next=/app/memory");
  const { account } = current;
  const supabase = await createSupabaseServerClient();

  const [{ data: memories }, { data: scopes }, tierInfo] = await Promise.all([
    supabase
      .from("conduit_memory")
      .select(
        "id, kind, content, tags, source_conversation_id, source_message_id, written_by, created_at, updated_at, pinned, locked",
      )
      .eq("account_id", account.id)
      .is("archived_at", null)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("conduit_memory_scope")
      .select("memory_id, employee_id")
      .in("memory_id",  /* batched ids from above */ ),
    Promise.resolve({ cap: account.internal_account ? 5000 : tierById(account.tier_id).memoryCap }),
  ]);
  // Group: globalRows (no scope rows) + perDept (mapped from scopes)
  // Mount <MemoryDesk initial={{ global, perDept, cap, total }} />
}
```

---

## 3. Section layout

```
┌────────────────────────────────────────────────────────────────────┐
│ What Praxis knows                                  47 / 200       │
│                                                                    │
│ ─── EVERYONE KNOWS ────────────────────────────  + Add memory      │
│ ┌─ pinned ────────────────────────────────────┐                    │
│ │ ⭐ User runs Lunaro, an insurance CRM …      │                    │
│ └──────────────────────────────────────────────┘                    │
│ ┌──────────────────────────────────────────────┐                    │
│ │ User's company is Conduit AI …               │                    │
│ └──────────────────────────────────────────────┘                    │
│                                                                    │
│ ─── MARKETING knows ─────────  (3)              + Add memory       │
│ ┌──────────────────────────────────────────────┐                    │
│ │ User's brand voice is warm and direct …      │                    │
│ └──────────────────────────────────────────────┘                    │
│                                                                    │
│ ─── SALES knows ─────────────  (1)              + Add memory       │
│ ┌──────────────────────────────────────────────┐                    │
│ │ User's primary ICP is Medicare agents …      │                    │
│ └──────────────────────────────────────────────┘                    │
│                                                                    │
│ ─── ENGINEERING knows ──────   (0)              Drop a tech note ↗ │
│   (Engineering doesn't know anything yet — drop a tech note.)      │
│   …                                                                │
└────────────────────────────────────────────────────────────────────┘
```

Order: Global first; then `EMPLOYEE_ORDER` (Atlas/Jarvis, Marketing, Sales,
Engineering, Finance, Compliance, HR, Ops, Legal).

---

## 4. Memory card affordances

Each card surface:
- Kind chip (top-left): small-caps eyebrow tracking.
- Content: serif italic, ~16px body-lg.
- Tag chips (bottom-left): muted small chips.
- Hover affordances (right edge, vertically stacked):
  - `pin` toggle (filled when pinned)
  - `lock` toggle (filled when locked)
  - `edit` (opens inline edit form replacing the content)
  - `archive` (soft-delete)
- "via Atlas" link (bottom-right, only when `source_conversation_id` is set) → `/app?c=<id>` (Slice 1 stub; full panel lands in P3 / US7).
- Dept-tint left rule (only when the card has a scope; global cards get a neutral border).

---

## 5. Add form

Triggered by section-level "+ Add memory" link. Expands inline at the top
of the section (above existing cards). Form fields:
- Kind picker: 5 chips (`fact`, `preference`, `decision`, `goal`, `context`).
- Scope picker (only on Global section's add form): 9 dept chips + "Everyone" toggle. When invoked from a specific dept section, the scope is pre-filled with that dept (with option to add others or toggle to Everyone).
- Content textarea: serif large body, autoresize.
- Tags input: chip-add pattern, lowercase enforced.
- Save / Cancel buttons.

Submit calls `POST /api/conduit/memory`:

```ts
{
  kind: "fact" | "preference" | "decision" | "goal" | "context",
  content: string,             // 1 ≤ len ≤ 1000
  tags: string[],              // ≤ 5, each ≤ 32 chars
  scope: EmployeeId[],         // empty = global
}
```

Response: `{ memory: <full row> }` with `pinned: false, locked: false, scope: <as submitted>`.

---

## 6. PATCH contract

`PATCH /api/conduit/memory/[id]` accepts a partial update:

```ts
{
  content?: string,
  tags?: string[],
  pinned?: boolean,
  locked?: boolean,
  scope?: EmployeeId[],         // replaces entire scope set atomically
}
```

Server transaction: if `scope` is present, DELETE all existing rows in
`conduit_memory_scope` for the memory + INSERT new rows. Other fields
update directly on `conduit_memory`.

Response: `{ memory: <full row> }`.

---

## 7. DELETE contract (archive, unchanged)

`DELETE /api/conduit/memory/[id]` — soft-delete (sets `archived_at`). Existing
behavior. Slice 1 adds an "Unarchive" affordance on the (existing) archived
view that POSTs `archived_at = null`.

---

## 8. Chat-route filter contract

`/api/conduit/chat/route.ts` memory loader changes:

```ts
const employeeId = computeActiveEmployee(messages); // existing helper
const memoryRows = await loadScopedMemories(supabase, account.id, employeeId);
const memoryBlock = renderMemoryBlock(trimMemoriesForPrompt(memoryRows));
```

`loadScopedMemories(supabase, accountId, employeeId)` returns:
- For `employeeId === "jarvis"` (Atlas): all non-archived memories for the account, ordered by `(pinned DESC, created_at DESC)` limit 60.
- For any other employee: memories where (NO scope rows exist OR a scope row matches that employee), same order, limit 60.

Implementation: either a Postgres function `conduit_memory_for_employee`
or two parallel queries client-side (global + scoped) merged + deduped.
Plan-time choice; contract is the response shape only.

---

## 9. Atlas `[REMEMBER]` extension

Existing tag parser at `src/lib/ai/memory.ts:57-111` is extended with an
optional `scope:` clause:

```
[REMEMBER: <kind> | <content> | <tags?> | scope: <dept|global>]
```

- The 4th pipe-separated segment, prefixed with `scope:`, names ONE dept OR `global`.
- For multi-dept scope, Atlas uses comma-separated: `scope: marketing, sales`.
- Backward-compat: missing the `scope:` segment → default `global` (current behavior preserved).
- Invalid dept name → ignore the scope, default `global`, log a system event.

`ATLAS_MEMORY_INSTRUCTIONS` is updated to document the new syntax with one
example:

> Optional: append `| scope: <dept>` (or `| scope: marketing, sales`) to
> route the memory to one or more departments only. Default is global.

---

## 10. Mobile reflow (FR-025)

At ≤ 640 px:
- Section headers wrap; eyebrow + count + add affordance stack.
- Card grid collapses to 1-up.
- Hover affordances become always-visible (touch has no hover).
- Add form's dept chips wrap to multiple rows.

---

## 11. Verification

See `quickstart.md §1`.
