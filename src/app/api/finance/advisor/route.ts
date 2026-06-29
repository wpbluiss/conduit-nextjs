import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { getSnapshot, getUserHouseholdId, adjustPooledCash } from "@/lib/finance/data";
import { isPlus, FREE_AI_MONTHLY_LIMIT } from "@/lib/finance/plan";
import {
  pooledCash, netWorth, projectIncome, payFrequencyMap, goalProgress, orderDebts,
  daysBetween, todayISO, investmentsValue,
} from "@/lib/finance/compute";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = process.env.ADVISOR_MODEL || "claude-opus-4-8";

const TOOLS: Anthropic.Tool[] = [
  {
    name: "log_savings",
    description: "Add money to the $75K down-payment goal fund.",
    input_schema: { type: "object", properties: { amount: { type: "number" }, note: { type: "string" } }, required: ["amount"] },
  },
  {
    name: "log_paycheck",
    description: "Log a paycheck for Luis or Delia. Income is variable; each check improves projections.",
    input_schema: { type: "object", properties: {
      person: { type: "string", enum: ["luis", "delia", "shared"] },
      take_home: { type: "number" }, gross: { type: "number" },
      mileage: { type: "number" }, job: { type: "string" }, date: { type: "string", description: "YYYY-MM-DD" },
    }, required: ["person", "take_home"] },
  },
  {
    name: "log_inflow",
    description: "Log a one-off inflow (gift, refund, side cash) into the shared pool.",
    input_schema: { type: "object", properties: {
      amount: { type: "number" }, source: { type: "string" },
      person: { type: "string", enum: ["luis", "delia", "shared"] }, date: { type: "string" },
    }, required: ["amount"] },
  },
  {
    name: "log_expense",
    description: "Add an expense or bill. Set recurrence + due_date for recurring bills.",
    input_schema: { type: "object", properties: {
      name: { type: "string" }, amount: { type: "number" }, category: { type: "string" },
      due_date: { type: "string" }, recurrence: { type: "string", enum: ["none", "weekly", "biweekly", "monthly", "yearly"] },
      person: { type: "string", enum: ["luis", "delia", "shared"] },
    }, required: ["name", "amount"] },
  },
  {
    name: "log_debt_payment",
    description: "Record a payment against a debt by its name. Reduces the balance.",
    input_schema: { type: "object", properties: {
      debt_name: { type: "string" }, amount: { type: "number" }, on_time: { type: "boolean" },
    }, required: ["debt_name", "amount"] },
  },
  {
    name: "log_child_support_payment",
    description: "Record Luis's child support payment ($175/mo, payable 1st-15th).",
    input_schema: { type: "object", properties: { amount: { type: "number" }, on_time: { type: "boolean" } } },
  },
  {
    name: "log_investment_buy",
    description: "Log buying a stock/ETF in Luis, Delia, or the daughter's custodial bucket.",
    input_schema: { type: "object", properties: {
      bucket: { type: "string", enum: ["luis", "delia", "daughter"] },
      ticker: { type: "string" }, amount: { type: "number" }, price: { type: "number" },
    }, required: ["bucket", "ticker", "amount"] },
  },
  {
    name: "add_debt",
    description: "Add a new debt the user mentions.",
    input_schema: { type: "object", properties: {
      name: { type: "string" }, balance: { type: "number" }, apr: { type: "number" },
      status: { type: "string" },
    }, required: ["name", "balance"] },
  },
  {
    name: "set_goal",
    description: "Update the savings goal, monthly savings target, or target date.",
    input_schema: { type: "object", properties: {
      savings_goal: { type: "number" }, monthly_savings_target: { type: "number" }, target_date: { type: "string" },
    } },
  },
  {
    name: "add_credit_score",
    description: "Log a credit score for Luis or Delia.",
    input_schema: { type: "object", properties: {
      person: { type: "string", enum: ["luis", "delia"] }, score: { type: "number" },
      bureau: { type: "string" }, date: { type: "string" },
    }, required: ["person", "score"] },
  },
];

type SB = Awaited<ReturnType<typeof createSupabaseServerClient>>;

async function runTool(sb: SB, hh: string, name: string, input: Record<string, unknown>): Promise<string> {
  const today = todayISO();
  const n = (v: unknown, d = 0) => (typeof v === "number" ? v : parseFloat(String(v ?? "")) || d);
  const s = (v: unknown, d = "") => (v == null ? d : String(v));

  switch (name) {
    case "log_savings": {
      await sb.from("fin_savings_log").insert({ household_id: hh, amount: n(input.amount), date: today, note: s(input.note) || "via advisor" });
      return `Logged ${input.amount} to the down-payment goal.`;
    }
    case "log_paycheck": {
      await sb.from("fin_paychecks").insert({
        household_id: hh, person_tag: s(input.person, "shared"), take_home: n(input.take_home),
        gross: n(input.gross), mileage_reimbursement: n(input.mileage), job: s(input.job) || null,
        pay_date: s(input.date) || today,
      });
      await adjustPooledCash(sb, n(input.take_home) + n(input.mileage));
      return `Logged a ${input.take_home} take-home paycheck for ${input.person}.`;
    }
    case "log_inflow": {
      await sb.from("fin_inflows").insert({ household_id: hh, amount: n(input.amount), source: s(input.source) || null, person_tag: s(input.person, "shared"), date: s(input.date) || today });
      await adjustPooledCash(sb, n(input.amount));
      return `Logged a ${input.amount} inflow.`;
    }
    case "log_expense": {
      const rec = s(input.recurrence, "none");
      await sb.from("fin_expenses").insert({
        household_id: hh, name: s(input.name, "Expense"), amount: n(input.amount), category: s(input.category, "general"),
        due_date: s(input.due_date) || null, recurrence: rec, recurring: rec !== "none", person_tag: s(input.person, "shared"),
      });
      return `Added expense "${input.name}" for ${input.amount}.`;
    }
    case "log_debt_payment": {
      const { data: debts } = await sb.from("fin_debts").select("*");
      const target = (debts ?? []).find((d) => d.name.toLowerCase().includes(s(input.debt_name).toLowerCase()));
      if (!target) return `No debt matching "${input.debt_name}". Existing: ${(debts ?? []).map((d) => d.name).join(", ")}.`;
      const amt = n(input.amount);
      const newBal = Math.max(0, Number(target.balance) - amt);
      await sb.from("fin_debts").update({ balance: newBal, status: newBal <= 0 ? "paid" : target.status === "past_due" ? "active" : target.status }).eq("id", target.id);
      await sb.from("fin_payments").insert({ household_id: hh, kind: "debt", ref_id: target.id, label: target.name, amount: amt, on_time: input.on_time !== false, date: today });
      await adjustPooledCash(sb, -amt);
      return `Paid ${amt} to ${target.name}. New balance ${newBal}${newBal <= 0 ? " — PAID OFF! 🎉" : ""}.`;
    }
    case "log_child_support_payment": {
      const { data: cs } = await sb.from("fin_child_support").select("*").limit(1).maybeSingle();
      if (!cs) return "No child support record found.";
      const amt = n(input.amount, cs.monthly_amount);
      const rem = Math.max(0, Number(cs.remaining_balance) - amt);
      await sb.from("fin_child_support").update({ remaining_balance: rem }).eq("id", cs.id);
      await sb.from("fin_payments").insert({ household_id: hh, kind: "child_support", ref_id: cs.id, label: "Child support", amount: amt, on_time: input.on_time !== false, date: today });
      await adjustPooledCash(sb, -amt);
      return `Logged ${amt} child support. Remaining ${rem}.`;
    }
    case "log_investment_buy": {
      const bucket = s(input.bucket, "luis"); const ticker = s(input.ticker, "VOO").toUpperCase();
      const amount = n(input.amount); const price = n(input.price);
      const shares = price > 0 ? amount / price : 0;
      const { data: ex } = await sb.from("fin_investments").select("*").eq("bucket", bucket).eq("ticker", ticker).maybeSingle();
      let id = ex?.id;
      if (ex) {
        await sb.from("fin_investments").update({ shares: Number(ex.shares) + shares, cost_basis: Number(ex.cost_basis) + amount, current_price: price || ex.current_price, last_price_update: today }).eq("id", ex.id);
      } else {
        const { data: c } = await sb.from("fin_investments").insert({ household_id: hh, bucket, ticker, shares, cost_basis: amount, current_price: price, last_price_update: today }).select("id").single();
        id = c?.id;
      }
      await sb.from("fin_investment_txns").insert({ household_id: hh, investment_id: id ?? null, bucket, ticker, amount, shares, price, date: today });
      return `Logged ${amount} buy of ${ticker} in ${bucket}'s bucket.`;
    }
    case "add_debt": {
      const bal = n(input.balance);
      await sb.from("fin_debts").insert({ household_id: hh, name: s(input.name, "Debt"), balance: bal, original_balance: bal, apr: n(input.apr), status: s(input.status, "active") });
      return `Added debt "${input.name}" (${bal}).`;
    }
    case "set_goal": {
      const patch: Record<string, unknown> = {};
      if (input.savings_goal != null) patch.savings_goal = n(input.savings_goal);
      if (input.monthly_savings_target != null) patch.monthly_savings_target = n(input.monthly_savings_target);
      if (input.target_date != null) patch.goal_target_date = s(input.target_date);
      await sb.from("fin_household").update(patch).eq("id", hh);
      return `Updated goal settings.`;
    }
    case "add_credit_score": {
      await sb.from("fin_credit_scores").insert({ household_id: hh, person_tag: s(input.person, "luis"), score: Math.round(n(input.score)), bureau: s(input.bureau, "TransUnion"), date: s(input.date) || today });
      return `Logged ${input.person}'s credit score: ${input.score}.`;
    }
    default:
      return `Unknown tool ${name}.`;
  }
}

function buildContext(snap: NonNullable<Awaited<ReturnType<typeof getSnapshot>>>): string {
  const cash = pooledCash(snap.accounts);
  const income = projectIncome(snap.paychecks, payFrequencyMap(snap.people));
  const g = goalProgress(snap.savingsLog, snap.household.savings_goal, snap.household.goal_start_date, snap.household.goal_target_date);
  const debt = orderDebts(snap.debts);
  const due = snap.expenses
    .filter((e) => !e.paid && e.due_date)
    .map((e) => ({ name: e.name, amount: e.amount, days: daysBetween(todayISO(), e.due_date as string) }))
    .filter((e) => e.days <= 30).sort((a, b) => a.days - b.days);

  return [
    `TODAY: ${todayISO()}`,
    `GOAL: $${g.saved.toLocaleString()} saved of $${g.goal.toLocaleString()} (${g.pct.toFixed(1)}%). ${g.onTrack ? "AHEAD" : "BEHIND"} pace by $${Math.abs(g.aheadBehindDollars).toFixed(0)}. Projected finish ${g.projectedCompletion ?? "unknown"}. Pace needed $${g.monthlyPaceNeeded.toFixed(0)}/mo. Monthly savings target $${snap.household.monthly_savings_target}.`,
    `POOLED CASH: $${cash.toLocaleString()}. NET WORTH: $${netWorth(snap).toFixed(0)}. INVESTMENTS: $${investmentsValue(snap.investments).toFixed(0)}.`,
    `INCOME (variable): ~$${income.monthly.toFixed(0)}/mo projected from ${income.count} paychecks logged${income.avgIntervalDays ? `, every ~${income.avgIntervalDays.toFixed(0)} days` : ""}.`,
    `DEBTS (total $${debt.total.toFixed(0)}, recommend ${debt.recommendation}): ${debt.debts.map((d) => `${d.name} $${d.balance}@${d.apr}%[${d.status}]`).join(", ") || "none"}. Attack next: ${debt.next?.name ?? "—"}. ${debt.rationale}`,
    snap.childSupport ? `CHILD SUPPORT (Luis): $${snap.childSupport.monthly_amount}/mo, $${snap.childSupport.remaining_balance} remaining, payable ${snap.childSupport.pay_window}.` : "",
    `DUE SOON: ${due.map((d) => `${d.name} $${d.amount} (${d.days <= 0 ? "now" : d.days + "d"})`).join(", ") || "nothing in 30d"}.`,
    `ACCOUNTS: ${snap.accounts.map((a) => `${a.name} $${a.balance}`).join(", ")}.`,
  ].filter(Boolean).join("\n");
}

const SYSTEM_BASE = `You are the private wealth team for Luis and Delia — their personal "private bank." You are warm, sharp, and honest: celebratory on wins, protective on risk, never a yes-man.

WHO: Luis and Delia are a couple with one shared goal — a down payment (~$75,000) for a ~$750K multi-tenant property in ~15 months. They pool ALL money into one combined pool; expenses are paid from the pool regardless of whose they are. Tags (luis/delia/shared) are for visibility only. Luis has variable income (hourly base + higher courthouse-day rate + mileage) and a child-support obligation ($175/mo). Delia works two jobs including a new restaurant job. They also invest small amounts (Luis $25-50/check, Delia $25, daughter's custodial $5-15).

YOUR JOB:
- Open with a short proactive status (standing vs. goal, what's due soon, best next move) when the conversation starts.
- Engineer the fastest, highest-return debt payoff order and explain the reasoning (interest saved, credit recovery). Smallest-first for momentum, but recommend avalanche when high APRs make it cheaper — say which and why.
- Advise diversified, low-cost investing while being HONEST about horizons: the property is the 15-month engine; investing is the long game. Never hype tickers or promise short-term returns.
- When they tell you something happened ("paid $175 child support today", "got a $150 gift", "bought $40 VOO in Delia's account"), USE THE TOOLS to log it, then confirm and show the updated impact.
- For one-off inflows, give a specific dollar split based on the current phase (cover near-term due bills → savings target → debt-killer; once debt is $0, everything rolls to savings).
- Warn with specifics before they overextend near a due date. Be concrete with dollars and dates.

STYLE: Concise, direct, human. Use their names. Use real numbers from the context. Short paragraphs. A little warmth and momentum. Never invent data you don't have — ask or use tools.`;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const hh = await getUserHouseholdId();
  if (!hh) return NextResponse.json({ error: "No household" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      reply: "I'm almost online — the household just needs an Anthropic API key set as ANTHROPIC_API_KEY in the Vercel environment, then I'll have full read+write access to your finances. (Everything else in the app works now.)",
      actions: [],
    });
  }

  const body = await req.json().catch(() => ({}));
  const userMessage: string = body.message ?? "";
  const history: { role: "user" | "assistant"; content: string }[] = Array.isArray(body.history) ? body.history.slice(-12) : [];

  const snap = await getSnapshot();
  if (!snap) return NextResponse.json({ error: "No data" }, { status: 500 });
  const sb = await createSupabaseServerClient();

  // Free-tier gate: cap AI messages per month; Plus is unlimited.
  if (!isPlus(snap.household)) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const { count } = await sb
      .from("fin_ai_messages")
      .select("id", { count: "exact", head: true })
      .eq("role", "user")
      .gte("created_at", monthStart.toISOString());
    if ((count ?? 0) >= FREE_AI_MONTHLY_LIMIT) {
      return NextResponse.json({
        reply: `You've used your ${FREE_AI_MONTHLY_LIMIT} free advisor messages this month. Upgrade to Cadence Plus for unlimited advice, bank sync, and more — tap Upgrade in the menu.`,
        actions: [],
        upsell: true,
      });
    }
  }

  const anthropic = new Anthropic({ apiKey });

  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: userMessage },
  ];

  const actions: string[] = [];
  let finalText = "";

  try {
    for (let i = 0; i < 6; i++) {
      const resp = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1400,
        system: [
          { type: "text", text: SYSTEM_BASE, cache_control: { type: "ephemeral" } },
          { type: "text", text: "CURRENT FINANCIAL CONTEXT:\n" + buildContext(snap) },
        ],
        tools: TOOLS,
        messages,
      });

      finalText = resp.content.filter((b) => b.type === "text").map((b) => (b as Anthropic.TextBlock).text).join("\n").trim();

      if (resp.stop_reason === "tool_use") {
        const toolUses = resp.content.filter((b) => b.type === "tool_use") as Anthropic.ToolUseBlock[];
        messages.push({ role: "assistant", content: resp.content });
        const results: Anthropic.ToolResultBlockParam[] = [];
        for (const tu of toolUses) {
          const out = await runTool(sb, hh, tu.name, tu.input as Record<string, unknown>);
          actions.push(out);
          results.push({ type: "tool_result", tool_use_id: tu.id, content: out });
        }
        messages.push({ role: "user", content: results });
        continue;
      }
      break;
    }

    // Persist conversation
    await sb.from("fin_ai_messages").insert([
      { household_id: hh, role: "user", content: userMessage },
      { household_id: hh, role: "assistant", content: finalText },
    ]);

    return NextResponse.json({ reply: finalText || "Done.", actions });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Advisor error";
    return NextResponse.json({ reply: `I hit a snag reaching my reasoning engine: ${msg}`, actions, error: msg }, { status: 200 });
  }
}
