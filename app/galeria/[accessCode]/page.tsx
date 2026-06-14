"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import BottomSheet from "@/components/BottomSheet";
import StickerGrid from "@/components/StickerGrid";
import type { Pack, Sticker } from "@/types/sticke";

type AccessData = {
  status: "pending" | "approved" | "rejected";
  pack: Pack;
  access_code: string;
  stickers: Sticker[] | null;
};

export default function GalleryPage() {
  const { accessCode } = useParams<{ accessCode: string }>();
  const [data, setData] = useState<AccessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [selected, setSelected] = useState<Sticker | null>(null);
  const [copyLabel, setCopyLabel] = useState("Copiar");
  const startedAt = useRef(Date.now());

  const checkAccess = useCallback(async () => {
    try {
      const response = await fetch(`/api/acesso?code=${encodeURIComponent(accessCode)}`, {
        cache: "no-store",
      });
      if (response.status === 404) {
        setInvalid(true);
        return;
      }
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setData(payload);
    } catch {
      setInvalid(true);
    } finally {
      setLoading(false);
    }
  }, [accessCode]);

  useEffect(() => {
    void checkAccess();
  }, [checkAccess]);

  useEffect(() => {
    if (data?.status !== "pending") return;
    const timer = window.setInterval(() => {
      if (Date.now() - startedAt.current >= 3 * 60 * 1000) {
        window.clearInterval(timer);
        return;
      }
      void checkAccess();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [data?.status, checkAccess]);

  async function copySticker(sticker: Sticker) {
    try {
      const response = await fetch(sticker.image_url);
      const sourceBlob = await response.blob();
      const pngBlob =
        sourceBlob.type === "image/png"
          ? sourceBlob
          : await new Promise<Blob>((resolve, reject) => {
              const image = new Image();
              image.crossOrigin = "anonymous";
              image.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;
                canvas.getContext("2d")?.drawImage(image, 0, 0);
                canvas.toBlob((blob) => (blob ? resolve(blob) : reject()), "image/png");
              };
              image.onerror = reject;
              image.src = URL.createObjectURL(sourceBlob);
            });
      await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })]);
      setCopyLabel("Copiado!");
      window.setTimeout(() => setCopyLabel("Copiar"), 2000);
    } catch {
      setCopyLabel("Não foi possível");
      window.setTimeout(() => setCopyLabel("Copiar"), 2000);
    }
  }

  function downloadSticker(sticker: Sticker) {
    const anchor = document.createElement("a");
    anchor.href = sticker.image_url;
    anchor.download = `${sticker.name || "figurinha-sticke"}.png`;
    anchor.target = "_blank";
    anchor.rel = "noopener";
    anchor.click();
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center font-bebas text-2xl">Verificando seu código...</main>;
  }
  if (invalid || !data) {
    return (
      <main className="mx-auto max-w-[400px] px-4 py-20 text-center">
        <div className="st-card p-7">
          <h1 className="font-bebas text-[28px] text-[var(--st-magenta)]">Código inválido</h1>
          <p className="mt-2 text-sm">Verifique se digitou corretamente.</p>
          <Link href="/acesso" className="st-btn-primary mt-5">Tentar novamente</Link>
        </div>
      </main>
    );
  }
  if (data.status === "pending") {
    return (
      <main className="mx-auto max-w-[440px] px-4 py-20 text-center">
        <div className="rounded-xl bg-[var(--st-ouro-soft)] p-5">
          <h1 className="font-bebas text-2xl">Aguardando pagamento...</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--st-ink-mid)]">
            Após o PIX cair, esta página atualiza automaticamente.
          </p>
          <div className="st-spinner mx-auto my-5" />
          <button type="button" className="st-btn-ghost" onClick={checkAccess}>Verificar agora</button>
        </div>
      </main>
    );
  }
  if (data.status === "rejected") {
    return (
      <main className="mx-auto max-w-[440px] px-4 py-20 text-center">
        <div className="st-card p-7">
          <h1 className="font-bebas text-3xl text-[var(--st-magenta)]">Pagamento não aprovado</h1>
          <p className="mt-2 text-sm">Gere um novo PIX para concluir sua compra.</p>
          <Link href={`/checkout/${data.pack.id}`} className="st-btn-primary mt-5">Voltar ao checkout</Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[var(--st-creme-border)] bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link href="/" aria-label="Stickê - Página inicial">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo.png" alt="Stickê" className="h-9 w-auto object-contain" />
          </Link>
          <span className="font-bebas text-xl">{data.pack.name}</span>
        </div>
      </header>
      <div className="bg-[var(--st-ouro-soft)] px-4 py-3 text-center text-[13px]">
        Guarde seu código:{" "}
        <strong className="font-mono-st text-sm text-[var(--st-magenta)]">{data.access_code}</strong>
      </div>
      <main className="mx-auto max-w-3xl p-5">
        {data.stickers?.length ? (
          <StickerGrid stickers={data.stickers} onSelect={setSelected} />
        ) : (
          <p className="py-20 text-center text-[var(--st-ink-mid)]">Este pack ainda não tem figurinhas.</p>
        )}
      </main>
      <BottomSheet
        sticker={selected}
        onClose={() => setSelected(null)}
        onCopy={copySticker}
        onDownload={downloadSticker}
        copyLabel={copyLabel}
      />
    </>
  );
}
