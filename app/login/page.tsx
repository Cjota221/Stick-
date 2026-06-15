"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import AuthShell from "@/components/AuthShell";

export default function LoginPage() {
  const router = useRouter();
  const debugEnabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("debug") === "1";
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debug, setDebug] = useState<Record<string, unknown> | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (debugEnabled) setDebug(payload.debug ?? { responseOk: response.ok, destination: payload.destination ?? null });

    if (!response.ok) {
      setLoading(false);
      setError(payload.error || "Não foi possível entrar.");
      return;
    }

    router.push(payload.destination || "/galeria");
  }

  return (
    <AuthShell title="Entre na Stickê" description="Use o e-mail e a senha cadastrados na compra.">
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-medium">
          E-mail
          <input
            className="st-input mt-2"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="block text-sm font-medium">
          Senha
          <input
            className="st-input mt-2"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button className="st-btn-primary w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
      {debugEnabled && debug && (
        <pre className="mt-6 overflow-auto rounded-xl bg-black/80 p-4 text-left text-xs leading-5 text-green-200">
          {JSON.stringify(debug, null, 2)}
        </pre>
      )}
      <div className="mt-6 flex items-center justify-between gap-4 text-sm">
        <Link href="/recuperar-senha" className="text-[var(--st-magenta)]">
          Esqueci minha senha
        </Link>
        <Link href="/cadastro" className="font-semibold text-[var(--st-magenta)]">
          Criar conta
        </Link>
      </div>
    </AuthShell>
  );
}
