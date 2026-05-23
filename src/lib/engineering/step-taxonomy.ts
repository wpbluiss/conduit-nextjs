// Plain-English step taxonomy for the build cinema. Pure derivation:
// reads session row + recent logs + optional heartbeat, returns a Step.
// Contract: specs/engineering-build-trust/contracts/step-taxonomy.md
//
// Honest by default: `index` / `total` ("step N of M") is deliberately
// omitted because the worker doesn't emit phase-marker signals today.
// Phase A2 verification refines the heuristic against real emissions.

export type SessionStatus =
  | "pending"
  | "running"
  | "deploying"
  | "complete"
  | "failed"
  | "timeout"
  | "aborted";

export type LogLevel = "info" | "stdout" | "stderr" | "system";

export type StepKind =
  | "queued"
  | "scaffolding"
  | "installing"
  | "writing"
  | "refining"
  | "deploying"
  | "shipped"
  | "failed"
  | "stopped"
  | "investigating"
  | "unknown";

export interface Step {
  label: string;
  eyebrow: string;
  kind: StepKind;
  index?: number;
  total?: number;
}

export interface FileTouch {
  path: string;
  kind: "write" | "edit";
  ts: string;
}

interface SessionForStep {
  status: SessionStatus;
  deploy_url?: string | null;
  error_message?: string | null;
}

interface LogForStep {
  ts: string;
  level: LogLevel;
  message: string;
}

type Heartbeat =
  | { kind: "healthy" }
  | { kind: "investigating"; since: number };

export function deriveStep(
  session: SessionForStep,
  recentLogs: LogForStep[],
  heartbeat?: Heartbeat,
): Step {
  // Rule 1 — heartbeat investigating override (non-terminal only)
  if (
    heartbeat?.kind === "investigating" &&
    (session.status === "pending" ||
      session.status === "running" ||
      session.status === "deploying")
  ) {
    return {
      label: "Investigating",
      eyebrow: "STILL THINKING",
      kind: "investigating",
    };
  }

  // Rule 2 — terminal statuses
  switch (session.status) {
    case "complete":
      return { label: "Shipped", eyebrow: "LIVE", kind: "shipped" };
    case "failed":
      return { label: "Failed", eyebrow: "DID NOT SHIP", kind: "failed" };
    case "timeout":
      return { label: "Timed out", eyebrow: "TOOK TOO LONG", kind: "failed" };
    case "aborted":
      return {
        label: "Stopped",
        eyebrow: "YOU STOPPED THE BUILD",
        kind: "stopped",
      };
    case "pending":
      return {
        label: "Queued",
        eyebrow: "WAITING FOR ENGINEERING",
        kind: "queued",
      };
    case "deploying":
      return {
        label: "Deploying",
        eyebrow: "PUSHING TO VERCEL",
        kind: "deploying",
      };
  }

  // session.status === 'running' from here on.
  // Rules 5a–5e — scan recent logs from end backwards.
  const tail = recentLogs.slice(-12);

  // 5a — install keywords
  for (let i = tail.length - 1; i >= 0; i--) {
    const m = tail[i].message;
    if (
      /^(npm|pnpm|yarn)\s+install\b|installing dependencies|adding \d+ packages?/i.test(
        m,
      )
    ) {
      return {
        label: "Installing",
        eyebrow: "INSTALLING DEPENDENCIES",
        kind: "installing",
      };
    }
  }

  // 5b — vercel / deploy keywords (status not yet `deploying`)
  for (let i = tail.length - 1; i >= 0; i--) {
    const m = tail[i].message;
    if (/\bvercel deploy\b|\buploading\b|\bbuilding for production\b/i.test(m)) {
      return {
        label: "Preparing deploy",
        eyebrow: "GETTING READY TO SHIP",
        kind: "deploying",
      };
    }
  }

  // 5c/5d — most-recent system log WRITE or EDIT
  for (let i = recentLogs.length - 1; i >= 0; i--) {
    const log = recentLogs[i];
    if (log.level !== "system") continue;
    const editMatch = log.message.match(/^EDIT\s+(.+)$/);
    if (editMatch) {
      return {
        label: "Refining",
        eyebrow: "REFINING THE PROJECT",
        kind: "refining",
      };
    }
    const writeMatch = log.message.match(/^WRITE\s+(.+)$/);
    if (writeMatch) {
      return {
        label: "Writing",
        eyebrow: "BUILDING THE PROJECT",
        kind: "writing",
      };
    }
    // Hit a non-WRITE/EDIT system log; keep searching backwards.
  }

  // 5e — no file events yet
  return {
    label: "Scaffolding",
    eyebrow: "SETTING UP",
    kind: "scaffolding",
  };
}

export function deriveFileTouches(
  logs: LogForStep[],
): FileTouch[] {
  const out: FileTouch[] = [];
  for (const log of logs) {
    if (log.level !== "system") continue;
    const m = log.message.match(/^(WRITE|EDIT)\s+(.+)$/);
    if (!m) continue;
    out.push({
      path: m[2].trim(),
      kind: m[1] === "WRITE" ? "write" : "edit",
      ts: log.ts,
    });
  }
  return out;
}

/** Distinct file count for in-flight tile + craft strip header. */
export function fileCount(touches: FileTouch[]): number {
  return new Set(touches.map((t) => t.path)).size;
}

/** Most-recently-touched file path (drives craft-strip pulse + in-flight strip). */
export function currentFile(touches: FileTouch[]): string | null {
  return touches.length === 0 ? null : touches[touches.length - 1].path;
}
