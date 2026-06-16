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
      window.setTimeout(() => setVisible(true), 2500);
    }

    if (isIOS) {
      setPlatform("ios");
      window.setTimeout(() => setVisible(true), 2500);
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
    <div className="fixed inset-x-4 bottom-4 z-50 rounded-2xl border-2 border-[var(--st-ink)] bg-white p-4 shadow-2xl sm:left-auto sm:right-4 sm:w-80">
      <div className="flex items-start gap-3">
        <img src="/brand/logo.png" alt="Stickê" className="h-9 w-9 rounded-lg object-contain" />
        <div className="flex-1">
          <p className="font-bebas text-base">Instale o Stickê</p>
          {platform === "android" ? (
            <p className="mt-0.5 text-xs text-[var(--st-ink-mid)]">
              Adicione à tela inicial para acessar suas figurinhas mais rápido.
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-[var(--st-ink-mid)]">
              Toque em compartilhar e depois em "Adicionar à Tela de Início".
            </p>
          )}
        </div>
        <button onClick={dismiss} aria-label="Fechar" className="text-[var(--st-ink-mid)]">
          ✕
        </button>
      </div>
      {platform === "android" && (
        <button type="button" onClick={install} className="st-btn-primary mt-3 w-full">
          Instalar agora
        </button>
      )}
    </div>
  );
}
