"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { deleteMyAccount } from "@/lib/finance/actions";
import { Button } from "./forms";

export function DangerZone() {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove() {
    start(async () => {
      const res = await deleteMyAccount();
      if (!res.ok) {
        setError(res.error || "Couldn't delete account.");
        return;
      }
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push("/cadence");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--fin-muted)]">
        Permanently delete your account and all household data. This can&apos;t be undone. If a partner shares
        your household, your data is removed when the last member leaves.
      </p>
      <label className="block">
        <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--fin-muted)] font-mono mb-1.5 block">
          Type DELETE to confirm
        </span>
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="DELETE"
          className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-[#e5484d]/60 transition"
        />
      </label>
      {error && <p className="text-xs text-[#f0888c]">{error}</p>}
      <Button
        variant="danger"
        disabled={pending || confirm !== "DELETE"}
        onClick={remove}
      >
        {pending ? "Deleting…" : "Delete my account & data"}
      </Button>
    </div>
  );
}
