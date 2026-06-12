import { type NextRequest } from "next/server";
import { checkVapiSecret, getVapiContext, vapiUnauthorized } from "@/lib/praxis/vapi-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!checkVapiSecret(req)) return vapiUnauthorized();
  return getVapiContext();
}
