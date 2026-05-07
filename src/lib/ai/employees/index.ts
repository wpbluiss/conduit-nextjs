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
  switch (employee) {
    case "jarvis":
      return atlasSystemPrompt(ctx);
    case "marketing":
      return marketingSystemPrompt(ctx);
    case "sales":
      return salesSystemPrompt(ctx);
    case "engineering":
      return engineeringSystemPrompt(ctx);
    case "finance":
      return financeSystemPrompt(ctx);
    case "compliance":
      return complianceSystemPrompt(ctx);
    case "hr":
      return hrSystemPrompt(ctx);
    case "ops":
      return opsSystemPrompt(ctx);
    case "legal":
      return legalSystemPrompt(ctx);
  }
}

export const EMPLOYEE_LABEL: Record<EmployeeKey, string> = Object.fromEntries(
  Object.entries(EMPLOYEES).map(([id, c]) => [id, c.name]),
) as Record<EmployeeKey, string>;
