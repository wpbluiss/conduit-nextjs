import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

const EMPLOYEE_LABELS: Record<string, string> = {
  jarvis: "Atlas",
  marketing: "Marketing",
  sales: "Sales",
  engineering: "Engineering",
  finance: "Finance",
  compliance: "Compliance",
  hr: "HR",
  ops: "Operations",
  legal: "Legal",
};

const MAX_MESSAGES = 2000;

interface RouteCtx {
  params: Promise<{ id: string }>;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function mdToSimpleHtml(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      if (line.startsWith("### ")) return `<h3>${escapeHtml(line.slice(4))}</h3>`;
      if (line.startsWith("## ")) return `<h2>${escapeHtml(line.slice(3))}</h2>`;
      if (line.startsWith("# ")) return `<h1>${escapeHtml(line.slice(2))}</h1>`;
      if (line.startsWith("- ") || line.startsWith("* "))
        return `<li>${escapeHtml(line.slice(2))}</li>`;
      if (line.trim() === "") return "<br/>";
      return `<p>${escapeHtml(line)}</p>`;
    })
    .join("\n");
}

export async function GET(request: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const account = await getOrCreateAccount(supabase, user);

  const { data: convo } = await supabase
    .from("conduit_conversations")
    .select("id, title, created_at, account_id")
    .eq("id", id)
    .maybeSingle();

  if (!convo || convo.account_id !== account.id) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { data: rows } = await supabase
    .from("conduit_messages")
    .select("role, employee, content, created_at")
    .eq("conversation_id", id)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: true })
    .limit(MAX_MESSAGES);

  const messages = (rows ?? []).filter(
    (m) => m.role === "user" || (m.role === "assistant" && m.employee),
  );

  const title = convo.title || "Praxis Conversation";
  const dateStr = new Date(convo.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const msgHtml = messages
    .map((m) => {
      if (m.role === "user") {
        return `<div class="msg msg-user"><span class="speaker">You</span><div class="body">${mdToSimpleHtml(m.content.trim())}</div></div>`;
      }
      const label = EMPLOYEE_LABELS[m.employee as string] ?? m.employee ?? "Assistant";
      return `<div class="msg msg-ai"><span class="speaker">${escapeHtml(label)}</span><div class="body">${mdToSimpleHtml(m.content.trim())}</div></div>`;
    })
    .join("\n");

  const truncated = (rows?.length ?? 0) >= MAX_MESSAGES;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — Praxis</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Georgia, serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #111;
    background: #fff;
    padding: 40px 60px;
    max-width: 820px;
    margin: 0 auto;
  }
  header {
    border-bottom: 1px solid #ccc;
    padding-bottom: 16px;
    margin-bottom: 32px;
  }
  header h1 { font-size: 18pt; margin-bottom: 4px; }
  header .meta { font-size: 9pt; color: #666; font-family: system-ui, sans-serif; }
  .msg { margin-bottom: 20px; }
  .speaker {
    display: block;
    font-family: system-ui, sans-serif;
    font-size: 8pt;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #888;
    margin-bottom: 4px;
  }
  .msg-user .speaker { color: #444; }
  .msg-ai .speaker { color: #c46a00; }
  .body p { margin-bottom: 6px; }
  .body h1, .body h2, .body h3 { margin: 10px 0 4px; font-size: 11pt; }
  .body li { margin-left: 20px; margin-bottom: 3px; }
  .truncation-note {
    margin-top: 32px;
    padding: 8px 12px;
    border: 1px solid #e0a000;
    border-radius: 4px;
    font-size: 9pt;
    color: #7a5000;
    font-family: system-ui, sans-serif;
  }
  footer {
    margin-top: 48px;
    border-top: 1px solid #eee;
    padding-top: 12px;
    font-size: 8pt;
    color: #aaa;
    font-family: system-ui, sans-serif;
  }
  @media print {
    body { padding: 0; }
    .no-print { display: none; }
    a { text-decoration: none; color: inherit; }
  }
</style>
</head>
<body>
<header>
  <h1>${escapeHtml(title)}</h1>
  <div class="meta">Praxis &nbsp;·&nbsp; ${escapeHtml(dateStr)} &nbsp;·&nbsp; ${messages.length} messages</div>
</header>

${msgHtml}

${truncated ? `<div class="truncation-note">Note: this conversation exceeds ${MAX_MESSAGES} messages. Only the first ${MAX_MESSAGES} are shown in this export.</div>` : ""}

<footer>Exported from Praxis &nbsp;·&nbsp; conduitai.io</footer>

<script>
  // Auto-trigger print dialog when opened in a new tab.
  window.addEventListener('load', function() {
    window.print();
  });
</script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}
