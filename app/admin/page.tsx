"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import PackImage from "@/components/PackImage";
import type { Pack, Sticker } from "@/types/sticke";

type PackForm = {
  id?: string;
  name: string;
  description: string;
  cover_url: string;
  price: number;
  is_active: boolean;
};

const emptyPack: PackForm = {
  name: "",
  description: "",
  cover_url: "",
  price: 27,
  is_active: true,
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<"packs" | "stickers">("packs");
  const [packs, setPacks] = useState<Pack[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selectedPackId, setSelectedPackId] = useState("");
  const [packForm, setPackForm] = useState<PackForm | null>(null);
  const [stickerName, setStickerName] = useState("");
  const [stickerUrl, setStickerUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const adminFetch = useCallback(
    (url: string, init: RequestInit = {}, overridePassword?: string) =>
      fetch(url, {
        ...init,
        headers: {
          ...init.headers,
          "X-Admin-Password": overridePassword ?? password,
        },
      }),
    [password],
  );

  const loadPacks = useCallback(async () => {
    const response = await adminFetch("/api/admin/packs");
    if (!response.ok) throw new Error("Sessão administrativa inválida.");
    const data = await response.json();
    setPacks(data.packs ?? []);
    if (!selectedPackId && data.packs?.[0]) setSelectedPackId(data.packs[0].id);
  }, [adminFetch, selectedPackId]);

  const loadStickers = useCallback(async () => {
    if (!selectedPackId) {
      setStickers([]);
      return;
    }
    const response = await adminFetch(`/api/admin/stickers?pack_id=${selectedPackId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    setStickers(data.stickers ?? []);
  }, [adminFetch, selectedPackId]);

  useEffect(() => {
    const saved = window.sessionStorage.getItem("sticke_admin_password");
    if (!saved) return;
    fetch("/api/admin/packs", { headers: { "X-Admin-Password": saved } }).then(async (response) => {
      if (!response.ok) return;
      const data = await response.json();
      setPassword(saved);
      setPacks(data.packs ?? []);
      setSelectedPackId(data.packs?.[0]?.id ?? "");
      setAuthenticated(true);
    });
  }, []);

  useEffect(() => {
    if (authenticated && tab === "stickers") void loadStickers();
  }, [authenticated, tab, loadStickers]);

  async function login(event: FormEvent) {
    event.preventDefault();
    setLoginError("");
    const response = await adminFetch("/api/admin/packs", {}, password);
    if (!response.ok) {
      setLoginError("Senha incorreta.");
      return;
    }
    const data = await response.json();
    window.sessionStorage.setItem("sticke_admin_password", password);
    setPacks(data.packs ?? []);
    setSelectedPackId(data.packs?.[0]?.id ?? "");
    setAuthenticated(true);
  }

  async function upload(file: File, folder: string) {
    const form = new FormData();
    form.append("file", file);
    form.append("folder", folder);
    const response = await adminFetch("/api/admin/upload", { method: "POST", body: form });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.url as string;
  }

  async function savePack(event: FormEvent) {
    event.preventDefault();
    if (!packForm) return;
    setBusy(true);
    setMessage("");
    try {
      const { id, ...body } = packForm;
      const response = await adminFetch("/api/admin/packs", {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id, ...body } : body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setPackForm(null);
      await loadPacks();
      setMessage("Pack salvo.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao salvar.");
    } finally {
      setBusy(false);
    }
  }

  async function removePack(id: string) {
    if (!window.confirm("Excluir este pack e todas as figurinhas dele?")) return;
    await adminFetch(`/api/admin/packs?id=${id}`, { method: "DELETE" });
    if (selectedPackId === id) setSelectedPackId("");
    await loadPacks();
  }

  async function togglePack(pack: Pack) {
    await adminFetch("/api/admin/packs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: pack.id, is_active: !pack.is_active }),
    });
    await loadPacks();
  }

  async function addSticker(event: FormEvent) {
    event.preventDefault();
    if (!selectedPackId || !stickerUrl) return;
    setBusy(true);
    const response = await adminFetch("/api/admin/stickers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pack_id: selectedPackId,
        name: stickerName || null,
        image_url: stickerUrl,
        sort_order: stickers.length,
      }),
    });
    setBusy(false);
    if (response.ok) {
      setStickerName("");
      setStickerUrl("");
      await loadStickers();
      await loadPacks();
    }
  }

  async function removeSticker(id: string) {
    await adminFetch(`/api/admin/stickers?id=${id}`, { method: "DELETE" });
    await loadStickers();
    await loadPacks();
  }

  if (!authenticated) {
    return (
      <main className="mx-auto max-w-[400px] px-4 py-20">
        <form className="st-card p-7" onSubmit={login}>
          <h1 className="font-bebas text-3xl">Admin Stickê</h1>
          <p className="mt-2 text-sm text-[var(--st-ink-mid)]">Entre com a senha administrativa.</p>
          <input
            className="st-input mt-5"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
          />
          {loginError && <p className="mt-2 text-sm text-red-700">{loginError}</p>}
          <button className="st-btn-primary mt-4 w-full">Entrar</button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1000px] px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-bebas text-4xl text-[var(--st-magenta)]">Painel Stickê</h1>
        <button
          type="button"
          className="st-btn-ghost"
          onClick={() => {
            sessionStorage.removeItem("sticke_admin_password");
            setAuthenticated(false);
            setPassword("");
          }}
        >
          Sair
        </button>
      </div>

      <div className="mb-7 flex gap-2">
        <button
          type="button"
          className={tab === "packs" ? "st-btn-primary" : "st-btn-ghost"}
          onClick={() => setTab("packs")}
        >
          Packs
        </button>
        <button
          type="button"
          className={tab === "stickers" ? "st-btn-primary" : "st-btn-ghost"}
          onClick={() => setTab("stickers")}
        >
          Figurinhas
        </button>
      </div>

      {message && <p className="mb-4 text-sm text-[var(--st-ink-mid)]">{message}</p>}

      {tab === "packs" ? (
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-bebas text-3xl">Packs</h2>
            <button type="button" className="st-btn-primary" onClick={() => setPackForm(emptyPack)}>
              + Novo pack
            </button>
          </div>

          {packForm && (
            <form className="st-card mb-6 grid gap-4 p-5 md:grid-cols-2" onSubmit={savePack}>
              <label className="text-sm font-medium">
                Nome
                <input
                  className="st-input mt-2"
                  required
                  value={packForm.name}
                  onChange={(event) => setPackForm({ ...packForm, name: event.target.value })}
                />
              </label>
              <label className="text-sm font-medium">
                Preço
                <input
                  className="st-input mt-2"
                  type="number"
                  min="0"
                  step=".01"
                  value={packForm.price}
                  onChange={(event) => setPackForm({ ...packForm, price: Number(event.target.value) })}
                />
              </label>
              <label className="text-sm font-medium md:col-span-2">
                Descrição
                <textarea
                  className="st-input mt-2"
                  rows={3}
                  value={packForm.description}
                  onChange={(event) => setPackForm({ ...packForm, description: event.target.value })}
                />
              </label>
              <label className="text-sm font-medium">
                Capa
                <input
                  className="mt-2 block w-full text-sm"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setBusy(true);
                    try {
                      const url = await upload(file, "covers");
                      setPackForm((current) => current && { ...current, cover_url: url });
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={packForm.is_active}
                  onChange={(event) => setPackForm({ ...packForm, is_active: event.target.checked })}
                />
                Pack ativo
              </label>
              <div className="flex gap-2 md:col-span-2">
                <button className="st-btn-primary" disabled={busy}>Salvar</button>
                <button type="button" className="st-btn-ghost" onClick={() => setPackForm(null)}>
                  Cancelar
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {packs.map((pack) => (
              <article key={pack.id} className="st-card flex flex-wrap items-center gap-4 p-4">
                <PackImage pack={pack} className="h-15 w-15 shrink-0 rounded-lg" />
                <div className="min-w-[180px] flex-1">
                  <h3 className="font-bebas text-xl">{pack.name}</h3>
                  <p className="text-xs text-[var(--st-ink-mid)]">
                    R$ {pack.price.toFixed(2).replace(".", ",")} · {pack.sticker_count ?? 0} figurinhas
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={Boolean(pack.is_active)} onChange={() => togglePack(pack)} />
                  Ativo
                </label>
                <button
                  type="button"
                  className="st-btn-ghost"
                  onClick={() =>
                    setPackForm({
                      id: pack.id,
                      name: pack.name,
                      description: pack.description || "",
                      cover_url: pack.cover_url || "",
                      price: pack.price,
                      is_active: Boolean(pack.is_active),
                    })
                  }
                >
                  Editar
                </button>
                <button type="button" className="st-btn-ghost" onClick={() => removePack(pack.id)}>
                  Excluir
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section>
          <h2 className="font-bebas text-3xl">Figurinhas</h2>
          <select
            className="st-input mt-4 max-w-sm"
            value={selectedPackId}
            onChange={(event) => setSelectedPackId(event.target.value)}
          >
            <option value="">Selecione um pack</option>
            {packs.map((pack) => <option key={pack.id} value={pack.id}>{pack.name}</option>)}
          </select>

          {selectedPackId && (
            <>
              <form className="st-card my-6 grid gap-4 p-5 md:grid-cols-2" onSubmit={addSticker}>
                <label className="text-sm font-medium">
                  Nome (opcional)
                  <input
                    className="st-input mt-2"
                    value={stickerName}
                    onChange={(event) => setStickerName(event.target.value)}
                  />
                </label>
                <label className="text-sm font-medium">
                  Imagem PNG, JPG ou WebP
                  <input
                    className="mt-2 block w-full text-sm"
                    type="file"
                    required={!stickerUrl}
                    accept="image/png,image/jpeg,image/webp"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      setBusy(true);
                      try {
                        setStickerUrl(await upload(file, "stickers"));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  />
                </label>
                <button className="st-btn-primary md:col-span-2" disabled={busy || !stickerUrl}>
                  {busy ? "Enviando..." : "+ Adicionar figurinha"}
                </button>
              </form>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {stickers.map((sticker) => (
                  <article key={sticker.id} className="st-card p-2">
                    <div className="sticke-xadrez aspect-square rounded-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sticker.image_url}
                        alt={sticker.name || "Figurinha"}
                        className="h-full w-full object-contain p-2"
                      />
                    </div>
                    <p className="mt-2 truncate text-xs">{sticker.name || "Sem nome"}</p>
                    <button
                      type="button"
                      className="st-btn-ghost mt-2 w-full px-2 py-2"
                      onClick={() => removeSticker(sticker.id)}
                    >
                      Remover
                    </button>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </main>
  );
}
