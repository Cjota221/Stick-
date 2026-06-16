"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BottomSheet from "@/components/BottomSheet";
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
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selected, setSelected] = useState<Sticker | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [copyLabel, setCopyLabel] = useState("Copiar");
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem("sticke_theme");
    const initial = stored === "dark" ? "dark" : "light";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("sticke_theme", next);
  }

  useEffect(() => {
    void fetch("/api/galeria", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error);
        setCategories(payload.categories);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Erro ao carregar."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCategoryId) return;
    setLoading(true);
    setError("");
    const query = selectedCategoryId === "all" ? "all" : selectedCategoryId;
    void fetch(`/api/galeria?category=${encodeURIComponent(query)}`, { cache: "no-store" })
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
  const selectedCategory =
    selectedCategoryId === "all"
      ? { name: "Catálogo completo" }
      : categories.find((category) => category.id === selectedCategoryId);
  const totalStickers = categories.reduce((total, category) => total + category.sticker_count, 0);

  async function copySticker(sticker: Sticker) {
    try {
      if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
        throw new Error("clipboard-unsupported");
      }
      const imagePromise = fetch(sticker.image_url)
        .then((response) => response.blob())
        .then((blob) => {
          if (blob.type === "image/png") return blob;
          return new Promise<Blob>((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
              const canvas = document.createElement("canvas");
              canvas.width = image.naturalWidth;
              canvas.height = image.naturalHeight;
              const ctx = canvas.getContext("2d");
              if (!ctx) return reject(new Error("canvas-context"));
              ctx.drawImage(image, 0, 0);
              canvas.toBlob(
                (pngBlob) => (pngBlob ? resolve(pngBlob) : reject(new Error("toBlob"))),
                "image/png",
              );
            };
            image.onerror = () => reject(new Error("image-load"));
            image.src = URL.createObjectURL(blob);
          });
        });

      await navigator.clipboard.write([new ClipboardItem({ "image/png": imagePromise })]);
      setCopyLabel("Copiado!");
    } catch (err) {
      console.error("copySticker failed", err);
      setCopyLabel("Toque e segure a imagem pra salvar");
      downloadSticker(sticker);
    }
    window.setTimeout(() => setCopyLabel("Copiar"), 2500);
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
      <header className="sticky top-0 z-30 border-b border-[var(--st-creme-border)] st-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 md:py-3">
          <Link href="/" aria-label="Stickê - Página inicial" className="shrink-0">
            <img src="/brand/logo.png" alt="Stickê" className="h-9 w-auto object-contain md:h-14" />
          </Link>

          <div className="hidden items-center gap-3 sm:flex">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Alternar tema claro/escuro"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--st-creme-border)] text-[var(--st-ink-mid)]"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <div className="text-right">
              <p className="font-bebas text-lg leading-none md:text-xl">
                Olá, {customerName.split(" ")[0] || "cliente"}
              </p>
              <p className="text-[11px] text-[var(--st-ink-mid)]">
                {categories.length} categorias · {totalStickers} figurinhas
              </p>
              <form action="/api/logout" method="post">
                <button className="mt-0.5 text-xs font-semibold text-[var(--st-magenta)]">
                  Sair da conta
                </button>
              </form>
            </div>
          </div>

          <button
            type="button"
            aria-label="Abrir menu da conta"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--st-creme-border)] text-[var(--st-magenta)] sm:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-[var(--st-creme-border)] st-surface px-4 py-3 sm:hidden">
            <p className="font-bebas text-lg">Olá, {customerName.split(" ")[0] || "cliente"}</p>
            <p className="text-xs text-[var(--st-ink-mid)]">
              {categories.length} categorias · {totalStickers} figurinhas
            </p>
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="text-xs font-semibold text-[var(--st-ink-mid)]"
              >
                {theme === "dark" ? "☀️ Modo claro" : "🌙 Modo escuro"}
              </button>
              <form action="/api/logout" method="post">
                <button className="text-xs font-semibold text-[var(--st-magenta)]">Sair da conta</button>
              </form>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 p-3 md:grid-cols-[260px_1fr] md:gap-6 md:p-6">
        <aside className="md:sticky md:top-32 md:self-start">
          <input
            className="st-input"
            type="search"
            placeholder="Buscar categoria..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2 md:max-h-[65vh] md:flex-col md:overflow-y-auto">
            {!search.trim() && (
              <button
                type="button"
                className={`shrink-0 rounded-xl border px-3 py-2 text-left text-xs transition md:px-4 md:py-3 md:text-sm ${
                  selectedCategoryId === "all"
                    ? "border-[var(--st-magenta)] bg-[var(--st-magenta)] text-white"
                    : "border-[var(--st-creme-border)] st-surface text-[var(--st-ink-mid)]"
                }`}
                onClick={() => setSelectedCategoryId("all")}
              >
                <strong className="block font-medium">Catálogo completo</strong>
                <span className="text-xs opacity-75">{totalStickers} figurinhas</span>
              </button>
            )}
            {filteredCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`shrink-0 rounded-xl border px-3 py-2 text-left text-xs transition md:px-4 md:py-3 md:text-sm ${
                  selectedCategoryId === category.id
                    ? "border-[var(--st-magenta)] bg-[var(--st-magenta)] text-white"
                    : "border-[var(--st-creme-border)] st-surface text-[var(--st-ink-mid)]"
                }`}
                onClick={() => setSelectedCategoryId(category.id)}
              >
                <strong className="block font-medium">{category.name}</strong>
                <span className="text-xs opacity-75">{category.sticker_count} figurinhas</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-4 md:mb-5">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--st-magenta)]">
              Categoria
            </span>
            <h1 className="font-bebas mt-1 text-3xl md:text-4xl">{selectedCategory?.name || "Sua galeria"}</h1>
            <p className="text-sm text-[var(--st-ink-mid)]">Toque em uma figurinha para copiar ou baixar.</p>
          </div>
          {error ? (
            <div className="st-card p-6 text-sm text-red-700">{error}</div>
          ) : loading ? (
            <div className="flex min-h-64 items-center justify-center"><div className="st-spinner" /></div>
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
