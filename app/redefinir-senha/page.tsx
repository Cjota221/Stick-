"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password.length < 8 || password !== confirmation) {
      setError("Use pelo menos 8 caracteres e repita a mesma senha.");
      return;
    }
    setLoading(true);
    const { error: updateError } = await getSupabaseBrowser().auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.replace("/galeria");
  }

  return (
    <AuthShell title="Nova senha" description="Escolha uma nova senha para sua conta.">
      <form onSubmit={submit} className="space-y-4">
        <input
          className="st-input"
          type="password"
          autoComplete="new-password"
          placeholder="Nova senha"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <input
          className="st-input"
          type="password"
          autoComplete="new-password"
          placeholder="Repita a nova senha"
          minLength={8}
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          required
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button className="st-btn-primary w-full" disabled={loading}>
          {loading ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
    </AuthShell>
  );
}
