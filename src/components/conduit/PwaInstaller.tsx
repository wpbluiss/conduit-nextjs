"use client";

import { useEffect, useState } from "react";
import { DownloadSimple, X, Share } from "@phosphor-icons/react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

export function PwaInstaller() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});

      // When a new SW activates via skipWaiting(), reload once so the client
      // gets fresh HTML + chunks instead of the pre-deploy app shell.
      let refreshed = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshed) {
          refreshed = true;
          window.location.reload();
        }
      });
    }

    const dismissed = localStorage.getItem("praxis.install.dismissed");
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;
    if (standalone || dismissed) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(
      navigator.userAgent,
    );
    if (isIOS && isSafari) {
      setIosHint(true);
      setShow(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    setShow(false);
    localStorage.setItem("praxis.install.dismissed", "1");
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[90] lg:left-auto lg:right-4 lg:w-80">
      <div
        className="conduit-card p-4 flex items-start gap-3"
        style={{
          boxShadow:
            "0 0 0 1px rgba(214,120,23,0.2), 0 8px 32px rgba(15,17,21,0.4)",
        }}
      >
        <div
          className="rounded-lg p-2 shrink-0"
          style={{ background: "rgba(214,120,23,0.12)" }}
        >
          <DownloadSimple
            size={18}
            weight="fill"
            style={{ color: "var(--color-ember-500)" }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[var(--color-cream)]">
            Install Praxis
          </div>
          {iosHint ? (
            <p className="text-xs text-[var(--color-cream-mute)] mt-1 flex items-center gap-1 flex-wrap">
              Tap <Share size={13} className="inline" /> Share →{" "}
              <span className="text-[var(--color-cream)]">
                Add to Home Screen
              </span>
            </p>
          ) : (
            <>
              <p className="text-xs text-[var(--color-cream-mute)] mt-1">
                Add to your home screen — opens full-screen like a native app.
              </p>
              <button
                onClick={install}
                className="mt-2 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-cream)] transition-colors"
                style={{ background: "var(--color-ember-500)" }}
              >
                Install
              </button>
            </>
          )}
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-[var(--color-cream-mute)] hover:text-[var(--color-cream)] p-0.5 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
