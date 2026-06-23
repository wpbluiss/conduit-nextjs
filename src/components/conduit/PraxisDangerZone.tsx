"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/conduit/ui/Button";

// Account-deletion "danger zone" for Praxis settings. Type-to-confirm,
// calls POST /api/conduit/account/delete, signs out, returns home.
export function PraxisDangerZone() {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove() {
    start(async () => {
      setError(null);
      try {
        const res = await fetch("/api/conduit/account/delete", { method: "POST" });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
          setError(
            j.error === "internal_account_protected"
              ? "This is an internal account — contact support to delete it."
              : j.detail || j.error || "Couldn't delete account. Try again.",
          );
          return;
        }
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
      } catch {
        setError("Couldn't delete account. Try again.");
      }
    });
  }

  return (
    <div
      className="mt-10 rounded-xl p-5"
      style={{
        border: "1px solid color-mix(in srgb, var(--cx-danger) 35%, var(--cx-border))",
        background: "color-mix(in srgb, var(--cx-danger) 5%, transparent)",
      }}
    >
      <h2 className="cx-type-sm font-semibold" style={{ color: "var(--cx-danger)" }}>
        Danger zone
      </h2>
      <p className="mt-1.5 cx-type-sm" style={{ color: "var(--cx-text-muted)" }}>
        Permanently delete your account and all of your data — conversations, memory,
        artifacts, builds, and voice history. This <strong>cannot be undone.</strong>
      </p>
      <label className="mt-4 block">
        <span className="mb-1.5 block cx-label text-[var(--cx-text-muted)]">
          Type DELETE to confirm
        </span>
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="DELETE"
          className="w-full cx-input"
        />
      </label>
      {error && (
        <p className="mt-2 cx-type-xs" style={{ color: "var(--cx-danger)" }}>
          {error}
        </p>
      )}
      <Button
        variant="danger"
        size="sm"
        isLoading={pending}
        loadingText="Deleting…"
        isDisabled={pending || confirm !== "DELETE"}
        onClick={remove}
        className="mt-4"
      >
        Delete my account & data
      </Button>
    </div>
  );
}
