import type { EmployeeKey } from "../provider";
import { type AccountContext, jarvisSystemPrompt } from "./jarvis";
import { marketingSystemPrompt } from "./marketing";
import { salesSystemPrompt } from "./sales";
import { engineeringSystemPrompt } from "./engineering";

export type { AccountContext };

export function systemPromptFor(
  employee: EmployeeKey,
  ctx: AccountContext,
): string {
  switch (employee) {
    case "jarvis":
      return jarvisSystemPrompt(ctx);
    case "marketing":
      return marketingSystemPrompt(ctx);
    case "sales":
      return salesSystemPrompt(ctx);
    case "engineering":
      return engineeringSystemPrompt(ctx);
  }
}

export const EMPLOYEE_LABEL: Record<EmployeeKey, string> = {
  jarvis: "Jarvis",
  marketing: "Marketing",
  sales: "Sales",
  engineering: "Engineering",
};
