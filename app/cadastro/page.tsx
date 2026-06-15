"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import AuthShell from "@/components/AuthShell";

export default function CadastroPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    passwordConfirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    const normalizedEmail = form.email.trim().toLowerCase();
    const response = await fetch("/api/checkout/criar-usuario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: normalizedEmail,
        phone: form.phone,
        password: form.password,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setLoading(false);
      setError(payload.error || "Não foi possível criar sua conta.");
      return;
    }

    const loginResponse = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail, password: form.password }),
    });
    setLoading(false);
    if (!loginResponse.ok) {
      setError("Conta criada. Entre com seu e-mail e senha para continuar.");
      return;
    }
    const loginPayload = await loginResponse.json();
    window.location.assign(loginPayload.destination === "/galeria" ? "/galeria" : "/checkout");
  }

  return (
    <AuthShell
      title="Crie sua conta"
      description="Sua conta libera o acesso vitalício depois que o pagamento for aprovado."
    >
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
      <p className="mt-6 text-center text-sm text-[var(--st-ink-mid)]">
        Já tem conta?{" "}
        <Link href="/login" className="font-semibold text-[var(--st-magenta)]">
          Entrar
        </Link>
      </p>
    </AuthShell>
  );
}
