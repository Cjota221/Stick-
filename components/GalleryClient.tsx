"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BottomSheet from "@/components/BottomSheet";
import ThemeToggle from "@/components/ThemeToggle";
import StickerGrid from "@/components/StickerGrid";
import type { Sticker } from "@/types/sticke";

type Category = {
  id: string;
  name: string;
  description?: string | null;
  sticker_count: number;
};

export default function GalleryClient({ customerName }: { customerName: string }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selected, setSelected] = useState<Sticker | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [copyLabel, setCopyLabel] = useState("Copiar");
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/galeria", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error);
        setCategories(payload.categories);
        setSelectedCategoryId(payload.categories[0]?.id || "");
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Erro ao carregar."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCategoryId) return;
    setLoading(true);
    setError("");
    void fetch(`/api/galeria?category=${encodeURIComponent(selectedCategoryId)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error);
        setStickers(payload.stickers);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Erro ao carregar."))
      .finally(() => setLoading(false));
  }, [selectedCategoryId]);

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return categories;
    return categories.filter((category) =>
      category.name.toLocaleLowerCase("pt-BR").includes(term),
    );
  }, [categories, search]);
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
  const totalStickers = categories.reduce((total, category) => total + category.sticker_count, 0);

  async function copySticker(sticker: Sticker) {
    try {
      const response = await fetch(sticker.image_url);
      const sourceBlob = await response.blob();
      const pngBlob =
        sourceBlob.type === "image/png"
          ? sourceBlob
          : await new Promise<Blob>((resolve, reject) => {
              const image = new Image();
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
    } catch {
      setCopyLabel("Não foi possível");
    }
    window.setTimeout(() => setCopyLabel("Copiar"), 2000);
  }

  function downloadSticker(sticker: Sticker) {
    const anchor = document.createElement("a");
    anchor.href = sticker.image_url;
    anchor.download = `${sticker.name || "figurinha-sticke"}.png`;
    anchor.target = "_blank";
    anchor.rel = "noopener";
    anchor.click();
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[var(--st-creme-border)] bg-[var(--st-header-bg)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:min-h-24 sm:gap-4">
          <Link href="/" aria-label="Stickê - Página inicial">
            <img
              src="/brand/logo.png"
              alt="Stickê"
              className="h-12 w-auto object-contain sm:h-20"
            />
          </Link>
          <div className="text-right">
            <p className="font-bebas text-base leading-none sm:text-xl">
              Olá, {customerName.split(" ")[0] || "cliente"}
            </p>
            <p className="mt-1 text-[11px] text-[var(--st-ink-mid)] sm:text-xs">
              {categories.length} categorias · {totalStickers} figurinhas
            </p>
            <div className="mt-1 flex items-center justify-end gap-2">
              <ThemeToggle />
              <form action="/api/logout" method="post">
                <button className="text-[11px] font-semibold text-[var(--st-magenta)] sm:text-xs">
                  Sair
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 p-3 sm:p-4 md:grid-cols-[260px_1fr] md:gap-6 md:p-6">
        <aside className="md:sticky md:top-32 md:self-start">
          <input
            className="st-input"
            type="search"
            placeholder="Buscar categoria..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2 md:max-h-[65vh] md:flex-col md:overflow-y-auto">
            {filteredCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`shrink-0 rounded-xl border px-3 py-2.5 text-left text-xs transition sm:px-4 sm:py-3 sm:text-sm ${
                  selectedCategoryId === category.id
                    ? "border-[var(--st-magenta)] bg-[var(--st-magenta)] text-white"
                    : "border-[var(--st-creme-border)] bg-[var(--st-surface)] text-[var(--st-ink-mid)]"
                }`}
                onClick={() => setSelectedCategoryId(category.id)}
              >
                <strong className="block font-medium">{category.name}</strong>
                <span className="text-xs opacity-75">{category.sticker_count} figurinhas</span>
              </button>
            ))}
          </div>
        </aside>

        <section>
          <div className="mb-4 sm:mb-5">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--st-magenta)]">
              Categoria
            </span>
            <h1 className="font-bebas mt-1 text-3xl sm:text-4xl">
              {selectedCategory?.name || "Sua galeria"}
            </h1>
            <p className="max-w-[34rem] text-sm text-[var(--st-ink-mid)]">
              Toque em uma figurinha para copiar ou baixar.
            </p>
          </div>
          {error ? (
            <div className="st-card p-6 text-sm text-red-700">{error}</div>
          ) : !categories.length ? (
            <div className="st-card p-6 text-sm text-[var(--st-ink-mid)]">
              Nenhuma categoria foi publicada ainda. O catálogo da galeria está vazio no momento.
            </div>
          ) : !stickers.length ? (
            <div className="st-card p-6 text-sm text-[var(--st-ink-mid)]">
              Esta categoria ainda não tem figurinhas publicadas.
            </div>
          ) : loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <div className="st-spinner" />
            </div>
          ) : (
            <StickerGrid stickers={stickers} onSelect={setSelected} />
          )}
        </section>
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
