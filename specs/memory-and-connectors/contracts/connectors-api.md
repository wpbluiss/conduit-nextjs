# Contract — Connectors API (Slice 2)

**Spec FRs**: FR-012 … FR-020
**Files**: `src/app/api/conduit/connectors/**/route.ts`, `src/app/app/connectors/page.tsx`, components under `src/components/conduit/connectors/`

This contract describes the API + UI surface for the GitHub PAT connector.
Tool-calling architecture is a separate contract (`tool-registry.md`).

---

## 1. URL contract

- **Surface**: `/app/connectors` (top-level, sibling to `/app/memory`, `/app/voice`, `/app/builds`).
- **API base**: `/api/conduit/connectors/*`.

---

## 2. API routes

### 2.1 `GET /api/conduit/connectors`

Lists the account's connector rows + per-connector grants.

Response:
```json
{
  "connectors": [
    {
      "id": "uuid",
      "kind": "github",
      "status": "connected",
      "credential_meta": { "username": "wpbluiss", "scopes": ["repo", "read:user"], "avatar_url": "https://…" },
      "last_used_at": "2026-05-23T18:34:00Z",
      "last_error": null,
      "created_at": "…",
      "granted_to": ["engineering"]
    }
  ],
  "tier_limit": 1
}
```

### 2.2 `POST /api/conduit/connectors/github/verify`

Verifies a PAT against GitHub and stores it encrypted on success.

Request:
```json
{ "token": "ghp_<actual-token>" }
```

(Token is in the request body only. Never in chat. Never echoed back.)

Server flow:
1. Auth: `getCurrentAccount()`.
2. Cap check: count existing connectors for account; reject with `409 connector_cap_reached` if at tier limit.
3. Token verify: `GET https://api.github.com/user` with `Authorization: Bearer <token>`. On non-200, return `400 token_invalid`. On 200, capture `login`, `avatar_url`, and X-OAuth-Scopes header.
4. Encrypt: insert row with `credential_encrypted = pgp_sym_encrypt($1, current_setting('app.credential_key'))` where `app.credential_key` is set per-request from the `CONNECTOR_CREDENTIAL_KEY` env var (see `contracts/encryption.md`).
5. Default grants: for each `default_employee_id` in `registry.github.defaultGrants`, INSERT a row in `conduit_connector_grants`.

Response:
```json
{
  "connector": {
    "id": "uuid",
    "kind": "github",
    "status": "connected",
    "credential_meta": { "username": "wpbluiss", "scopes": [...], "avatar_url": "…" },
    "granted_to": ["engineering"]
  }
}
```

(Token never in response.)

### 2.3 `DELETE /api/conduit/connectors/[id]`

Disconnects: DELETE from `conduit_connectors` (cascades grants). No
soft-delete (security choice — destroy the encrypted credential).

Response: `{ ok: true }`.

### 2.4 `POST /api/conduit/connectors/[id]/grant`

Toggle a per-employee grant.

Request:
```json
{ "employee_id": "marketing", "granted": true }
```

Server: INSERT or DELETE the row in `conduit_connector_grants` based on
the boolean.

Response: `{ granted_to: <new array> }`.

---

## 3. UI contract

### 3.1 Page composition

```
┌──────────────────────────────────────────────────────────┐
│ What Praxis can touch                                    │
│ Connect your real tools so departments can read your data.│
│                                                          │
│ ┌────────────────────────────────┐                       │
│ │  [GitHub octocat]              │                       │
│ │  GitHub                        │                       │
│ │  ● Connected · @wpbluiss       │                       │
│ │                                │                       │
│ │  Departments with access:      │                       │
│ │  [Atlas] [Mktg] [Sales]        │                       │
│ │  [✓Eng]  [Fin]  [Cmp]          │                       │
│ │  [HR]    [Ops]  [Legal]        │                       │
│ │                                │                       │
│ │  Disconnect ↗                  │                       │
│ └────────────────────────────────┘                       │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Connect flow

Click `Connect` → drawer slides in from right:

```
┌────────────────────────────────────────┐
│ Connect GitHub                    [×]  │
│                                        │
│ Paste a Personal Access Token below.   │
│ We encrypt it at rest. Only Engineering│
│ will use it. We never show it back to  │
│ you.                                   │
│                                        │
│ [How to generate a token ↗]            │
│                                        │
│ Token:                                 │
│ [                              ] (pwd) │
│                                        │
│           [Cancel]  [Verify + connect] │
└────────────────────────────────────────┘
```

Drawer behavior:
- `<input type="password" autocomplete="off" spellcheck="false">` for the token.
- Verify button disabled until input has ≥ 30 chars (GitHub PATs are 40 chars).
- On submit: POST `/api/conduit/connectors/github/verify`; on success the drawer closes + the tile flips to Connected with a 1.2s gold-flash celebration; on failure the drawer surfaces a translated error (`Token didn't authenticate. Generate a fresh one and try again.`).
- The token value is held in component state only during the verify call. After the response arrives (success or fail), the state is wiped.

### 3.3 Grant chip behavior

- Default state per `registry.github.defaultGrants = ["engineering"]`.
- Click a chip → POST `/api/conduit/connectors/[id]/grant`. Optimistic update; revert on error.
- 600ms confirmation pulse on the chip after server confirms.

### 3.4 Disconnect

- Click `Disconnect ↗` → confirm modal: "Disconnect GitHub? Your token will be destroyed and Engineering will lose access."
- On confirm: DELETE `/api/conduit/connectors/[id]`. Tile flips to `Not connected`.

---

## 4. Mobile reflow

At ≤ 640 px:
- Tiles stack 1-up.
- Drawer becomes full-screen sheet from the bottom.
- Grant chips wrap to 3 rows of 3 (instead of 1 row of 9).

---

## 5. Error states + recovery

| Server response | UI surface |
|---|---|
| `400 token_invalid` | "Token didn't authenticate. Generate a fresh one." |
| `409 connector_cap_reached` | "You've hit your plan's connector limit. Upgrade to Pro for more." + billing link |
| `500 encryption_failed` (env-var missing) | "Connector storage isn't configured yet. Tell Luis." (operator-tier shows the env-var name) |
| `401 unauthorized` (RLS-denied disconnect) | "You can't disconnect a connector you don't own." (shouldn't happen via UI; defensive) |
| GitHub `401` mid-chat | Tile auto-flips to `Reconnect required`; chat surface shows translated error |
| GitHub `403` mid-chat | Same as 401 |
| GitHub `404` (file/repo not found) | Chat surface only — "Engineering tried to read X but couldn't find it." Connector stays connected |

---

## 6. Verification

See `quickstart.md §2`.
