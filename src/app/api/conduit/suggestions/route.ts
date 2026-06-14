import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { complete } from "@/lib/ai/provider";
import type { EmployeeKey } from "@/lib/ai/provider";
import { employeeLabel } from "@/components/conduit/EmployeeBadge";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SYSTEM = `You generate exactly 3 short follow-up prompt suggestions for a user chatting with a business AI assistant.
Return ONLY a JSON array of 3 strings. Each string is ≤ 10 words. No markdown, no explanation, just the array.
Example: ["Draft a one-pager on this","Build me a template for this","What are the next steps?"]`;

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { employee?: string; lastMessage?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const { employee, lastMessage } = body;
  if (!lastMessage || typeof lastMessage !== "string") {
    return NextResponse.json({ error: "lastMessage required" }, { status: 400 });
  }

  const account = await getOrCreateAccount(supabase, user);
  const employeeName = employee ? employeeLabel(employee as EmployeeKey) : "Praxis";

  let result;
  try {
    result = await complete({
      systemPrompt: SYSTEM,
      messages: [
        {
          role: "user",
          content: `${employeeName} just said:\n\n${lastMessage.slice(0, 800)}\n\nGenerate 3 follow-up suggestions.`,
        },
      ],
      maxTokens: 120,
      metadata: {
        accountId: account.id,
        intent: "routing",
      },
    });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }

  let suggestions: string[] = [];
  try {
    const raw = result.content.trim();
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) suggestions = JSON.parse(match[0]) as string[];
    suggestions = suggestions.slice(0, 3).filter((s: unknown) => typeof s === "string");
  } catch {
    suggestions = [];
  }

  return NextResponse.json({ suggestions });
}
