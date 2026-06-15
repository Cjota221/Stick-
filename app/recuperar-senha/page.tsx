"use client";

import { FormEvent, useState } from "react";
import AuthShell from "@/components/AuthShell";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { error } = await getSupabaseBrowser().auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/redefinir-senha` },
    );
    setLoading(false);
    setMessage(
      error
        ? error.message
        : "Se existir uma conta com esse e-mail, enviaremos o link para redefinir a senha.",
    );
  }

  return (
    <AuthShell title="Recuperar senha" description="Enviaremos um link seguro para o seu e-mail.">
      <form onSubmit={submit} className="space-y-4">
        <input
          className="st-input"
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        {message && <p className="text-sm leading-6 text-[var(--st-ink-mid)]">{message}</p>}
        <button className="st-btn-primary w-full" disabled={loading}>
          {loading ? "Enviando..." : "Enviar link"}
        </button>
      </form>
    </AuthShell>
  );
}
