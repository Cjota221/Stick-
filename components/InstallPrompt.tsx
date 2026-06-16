"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "sticke_install_dismissed";

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<"android" | "ios" | null>(null);
  const [deferredEvent, setDeferredEvent] = useState<any>(null);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) return;

    const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

    function handleBeforeInstall(event: Event) {
      event.preventDefault();
      setDeferredEvent(event);
      setPlatform("android");
      window.setTimeout(() => setVisible(true), 8000);
    }

    if (isIOS) {
      setPlatform("ios");
      window.setTimeout(() => setVisible(true), 8000);
    } else {
      window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    }

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, "1");
  }

  async function install() {
    if (deferredEvent) {
      deferredEvent.prompt();
      await deferredEvent.userChoice;
    }
    dismiss();
  }

  if (!visible || !platform) return null;

  return (
    <div className="fixed inset-x-2 bottom-2 z-50 rounded-2xl border border-[var(--st-ink)] bg-[var(--st-surface)] px-3 py-3 shadow-2xl sm:left-auto sm:right-4 sm:bottom-4 sm:w-80 sm:px-4">
      <div className="flex items-start gap-3">
        <img src="/brand/logo.png" alt="Stickê" className="h-8 w-8 rounded-lg object-contain" />
        <div className="min-w-0 flex-1">
          <p className="font-bebas text-[15px] leading-none">Instale o Stickê</p>
          <p className="mt-1 text-[11px] leading-5 text-[var(--st-ink-mid)]">
            {platform === "android"
              ? "Adicione à tela inicial para abrir mais rápido."
              : 'Toque em compartilhar e depois em "Adicionar à Tela de Início".'}
          </p>
          {platform === "android" && (
            <button type="button" onClick={install} className="st-btn-primary mt-2 w-full py-2 text-sm">
              Instalar
            </button>
          )}
        </div>
        <button onClick={dismiss} aria-label="Fechar" className="text-[var(--st-ink-mid)]">
          ✕
        </button>
      </div>
    </div>
  );
}
