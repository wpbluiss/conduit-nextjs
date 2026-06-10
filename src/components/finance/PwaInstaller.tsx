"use client";

import { useEffect, useState } from "react";
import { DownloadSimple, X, Share } from "@phosphor-icons/react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function PwaInstaller() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    // register the service worker (scoped to the app)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/cadence-sw.js", { scope: "/finance" }).catch(() => {});
    }

    const dismissed = localStorage.getItem("cadence.install.dismissed");
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone || dismissed) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS Safari never fires beforeinstallprompt — show a manual hint.
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
    if (isIOS && isSafari) {
      setIosHint(true);
      setShow(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    setShow(false);
    localStorage.setItem("cadence.install.dismissed", "1");
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
      <div className="fin-card fin-glow p-4 flex items-start gap-3">
        <div className="rounded-lg bg-[#ff8a3d]/15 p-2 shrink-0">
          <DownloadSimple size={18} weight="fill" className="text-[#ffa876]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">Install Cadence</div>
          {iosHint ? (
            <p className="text-[12px] text-[var(--fin-muted)] mt-1 flex items-center gap-1 flex-wrap">
              Tap <Share size={13} className="inline" /> Share → <span className="text-white">Add to Home Screen</span>
            </p>
          ) : (
            <>
              <p className="text-[12px] text-[var(--fin-muted)] mt-1">
                Add it to your home screen — opens full-screen, like a native app.
              </p>
              <button
                onClick={install}
                className="fin-btn-animate mt-2 rounded-lg px-3 py-1.5 text-xs font-medium"
              >
                Install
              </button>
            </>
          )}
        </div>
        <button onClick={dismiss} aria-label="Dismiss" className="text-[var(--fin-muted)] hover:text-white p-0.5">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
