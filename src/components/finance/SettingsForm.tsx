"use client";

import { useState, useTransition } from "react";
import { SubmitButton } from "./forms";

export function SettingsForm({
  action,
  submitLabel,
  children,
}: {
  action: (form: FormData) => Promise<{ ok: boolean; error?: string }>;
  submitLabel: string;
  children: React.ReactNode;
}) {
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(fd: FormData) {
    start(async () => {
      const res = await action(fd);
      if (res.ok) {
        setSaved(true);
        setError(null);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(res.error || "Failed");
      }
    });
  }

  return (
    <form action={submit} className="space-y-3">
      {children}
      {error && <p className="text-xs text-[#f0888c]">{error}</p>}
      {saved && <p className="text-xs text-[#7cc6a0]">Saved ✓</p>}
      <SubmitButton pending={pending} variant="primary">{submitLabel}</SubmitButton>
    </form>
  );
}
