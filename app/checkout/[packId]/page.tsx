"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import Header from "@/components/Header";
import PackImage from "@/components/PackImage";
import PixBlock from "@/components/PixBlock";
import type { Pack, PixData } from "@/types/sticke";

export default function CheckoutPage() {
  const { packId } = useParams<{ packId: string }>();
  const [pack, setPack] = useState<Pack | null>(null);
  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pixData, setPixData] = useState<PixData | null>(null);

  useEffect(() => {
    fetch("/api/packs")
      .then((response) => response.json())
      .then(({ packs }) => setPack(packs?.find((item: Pack) => item.id === packId) ?? null))
      .catch(() => setError("Não foi possível carregar este pack."));
  }, [packId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!email || email !== emailConfirm) {
      setError("Preencha os dois campos com o mesmo email.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, packId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setPixData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível gerar o PIX.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[440px] px-4 py-15">
        <div className="st-card p-7">
          {!pack && !error ? (
            <p className="text-center">Carregando pack...</p>
          ) : pack ? (
            <>
              <div className="mb-7 flex items-center gap-4">
                <PackImage pack={pack} className="h-20 w-20 shrink-0 rounded-[10px]" />
                <div>
                  <h1 className="font-bebas text-3xl">{pack.name}</h1>
                  <p className="font-mono-st text-xl text-[var(--st-magenta)]">
                    R$ {pack.price.toFixed(2).replace(".", ",")}
                  </p>
                </div>
              </div>
              {!pixData ? (
                <form onSubmit={submit} className="space-y-4">
                  <label className="block text-sm font-medium">
                    Seu melhor email
                    <input
                      className="st-input mt-2"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Confirmar email
                    <input
                      className="st-input mt-2"
                      type="email"
                      value={emailConfirm}
                      onChange={(event) => setEmailConfirm(event.target.value)}
                    />
                  </label>
                  {error && <p className="text-sm text-red-700">{error}</p>}
                  <button className="st-btn-primary w-full" disabled={loading}>
                    {loading ? "Gerando..." : "Gerar PIX"}
                  </button>
                </form>
              ) : (
                <>
                  <PixBlock
                    qrCodeBase64={pixData.qr_code_base64}
                    qrCode={pixData.qr_code}
                    accessCode={pixData.access_code}
                  />
                  <Link href={`/galeria/${pixData.access_code}`} className="st-btn-ouro mt-4 w-full">
                    Já paguei → Acessar galeria
                  </Link>
                </>
              )}
            </>
          ) : (
            <p className="text-center text-red-700">{error || "Pack não encontrado."}</p>
          )}
        </div>
      </main>
    </>
  );
}
