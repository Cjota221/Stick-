"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function CadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    passwordConfirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationSent, setConfirmationSent] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.phone.trim()) {
      setError("Preencha seu nome e telefone.");
      return;
    }
    if (form.password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setError("As duas senhas precisam ser iguais.");
      return;
    }

    setLoading(true);
    const appUrl = window.location.origin;
    const { data, error: signUpError } = await getSupabaseBrowser().auth.signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback?next=/checkout`,
        data: { name: form.name.trim(), phone: form.phone.trim() },
      },
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (data.session) {
      router.replace("/checkout");
      router.refresh();
      return;
    }
    setConfirmationSent(true);
  }

  return (
    <AuthShell
      title="Crie sua conta"
      description="Sua conta libera o acesso vitalício depois que o pagamento for aprovado."
    >
      {confirmationSent ? (
        <div className="rounded-xl bg-[var(--st-ouro-soft)] p-5 text-center">
          <h2 className="font-bebas text-2xl">Confirme seu e-mail</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--st-ink-mid)]">
            Enviamos um link para {form.email}. Abra o e-mail para continuar no checkout.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-medium">
            Nome completo
            <input
              className="st-input mt-2"
              autoComplete="name"
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-medium">
            E-mail
            <input
              className="st-input mt-2"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Telefone
            <input
              className="st-input mt-2"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(event) => update("phone", event.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Senha
            <input
              className="st-input mt-2"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={form.password}
              onChange={(event) => update("password", event.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Repita a senha
            <input
              className="st-input mt-2"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={form.passwordConfirm}
              onChange={(event) => update("passwordConfirm", event.target.value)}
              required
            />
          </label>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button className="st-btn-primary w-full" disabled={loading}>
            {loading ? "Criando conta..." : "Continuar para o pagamento"}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-[var(--st-ink-mid)]">
        Já tem conta?{" "}
        <Link href="/login" className="font-semibold text-[var(--st-magenta)]">
          Entrar
        </Link>
      </p>
    </AuthShell>
  );
}
