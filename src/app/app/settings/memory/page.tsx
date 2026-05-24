// R17 Slice 1: Memory promoted to top-level /app/memory. This route
// redirects to preserve any bookmarks / links from before the promotion.

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function SettingsMemoryRedirect() {
  redirect("/app/memory");
}
