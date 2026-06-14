import type { EmployeeKey } from "../provider";
import { type AccountContext, atlasSystemPrompt } from "./jarvis";
import { marketingSystemPrompt } from "./marketing";
import { salesSystemPrompt } from "./sales";
import { engineeringSystemPrompt } from "./engineering";
import { financeSystemPrompt } from "./finance";
import { complianceSystemPrompt } from "./compliance";
import { hrSystemPrompt } from "./hr";
import { opsSystemPrompt } from "./ops";
import { legalSystemPrompt } from "./legal";
import { EMPLOYEES } from "@/lib/conduit/employees";

export type { AccountContext };

export function systemPromptFor(
  employee: EmployeeKey,
  ctx: AccountContext,
): string {
  let base: string;
  switch (employee) {
    case "jarvis":   base = atlasSystemPrompt(ctx); break;
    case "marketing": base = marketingSystemPrompt(ctx); break;
    case "sales":    base = salesSystemPrompt(ctx); break;
    case "engineering": base = engineeringSystemPrompt(ctx); break;
    case "finance":  base = financeSystemPrompt(ctx); break;
    case "compliance": base = complianceSystemPrompt(ctx); break;
    case "hr":       base = hrSystemPrompt(ctx); break;
    case "ops":      base = opsSystemPrompt(ctx); break;
    case "legal":    base = legalSystemPrompt(ctx); break;
  }
  // Inject company_brief into non-Atlas specialists so all 9 team members
  // share the same business context (Atlas already has it in its own prompt).
  if (employee !== "jarvis" && ctx.company_brief) {
    base +=
      `\n\n— Company brief (owner's own words — shared business context) —\n${ctx.company_brief}`;
  }
  return base;
}

export const EMPLOYEE_LABEL: Record<EmployeeKey, string> = Object.fromEntries(
  Object.entries(EMPLOYEES).map(([id, c]) => [id, c.name]),
) as Record<EmployeeKey, string>;
