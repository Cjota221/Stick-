"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const supabase = getSupabaseBrowser();
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (loginError || !data.user) {
      setLoading(false);
      setError(loginError?.message || "Não foi possível entrar.");
      return;
    }

    const destinationResponse = await fetch("/api/post-login", { cache: "no-store" });
    const destinationPayload = await destinationResponse.json().catch(() => ({}));
    router.replace(destinationPayload.destination || "/galeria");
    router.refresh();
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
