"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

export default function AcessoPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (normalized) router.push(`/galeria/${encodeURIComponent(normalized)}`);
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[400px] px-4 py-20">
        <form className="st-card p-7" onSubmit={submit}>
          <h1 className="font-bebas text-[32px]">Já comprei</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--st-ink-mid)]">
            Digite o código que você recebeu na hora do pagamento.
          </p>
          <input
            className="st-input font-mono-st mt-5 uppercase"
            placeholder="Ex: A8F4C2D1B3E7F209"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          <button className="st-btn-primary mt-4 w-full">Acessar galeria</button>
        </form>
      </main>
    </>
  );
}
