"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PixBlock from "@/components/PixBlock";
import { STICKE_ACCESS_PRICE } from "@/lib/product";

type CheckoutStatus = "pending" | "approved" | "rejected" | "cancelled";

type CheckoutResult = {
  status: CheckoutStatus;
  purchase_id?: string;
  payment_id?: string;
  qr_code?: string;
  qr_code_base64?: string;
  redirect_url?: string;
};

type TokenizeResult = {
  token: string;
  paymentMethodId: string;
};

type PaymentMode = "pix" | "card";

type CardForm = {
  cardNumber: string;
  cardholderName: string;
  expirationMonth: string;
  expirationYear: string;
  securityCode: string;
  cpf: string;
};

const LAST_PAYMENT_STORAGE_KEY = "sticke:lastPaymentId";

const emptyCardForm: CardForm = {
  cardNumber: "",
  cardholderName: "",
  expirationMonth: "",
  expirationYear: "",
  securityCode: "",
  cpf: "",
};

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export default function CheckoutPayment({ email, name }: { email: string; name: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<PaymentMode>("pix");
  const [card, setCard] = useState<CardForm>(emptyCardForm);
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("Escolha Pix ou cartao para continuar.");

  useEffect(() => {
    const savedPaymentId = window.localStorage.getItem(LAST_PAYMENT_STORAGE_KEY);
    if (savedPaymentId) {
      setResult({ status: "pending", payment_id: savedPaymentId });
      setMessage("Encontramos um pagamento anterior e estamos verificando o status.");
    }
  }, []);

  useEffect(() => {
    const paymentId = result?.payment_id ?? "";
    const status = result?.status;
    if (!paymentId || status !== "pending") return;

    let cancelled = false;

    async function checkStatus() {
      const response = await fetch(`/api/checkout/status?paymentId=${encodeURIComponent(paymentId)}`, {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (cancelled) return;

      if (response.status === 401) {
        router.replace("/login?next=/checkout");
        return;
      }

      if (response.status === 403) {
        setError(payload.error || "Este pagamento nao pertence a esta conta.");
        setMessage("Este pagamento nao pertence a esta conta.");
        return;
      }

      if (payload.status === "approved") {
        window.localStorage.removeItem(LAST_PAYMENT_STORAGE_KEY);
        setMessage("Pagamento aprovado. Entrando na galeria...");
        router.replace("/galeria");
        router.refresh();
        return;
      }

      if (payload.status === "rejected" || payload.status === "cancelled") {
        setError("O pagamento foi recusado ou cancelado.");
        setMessage("Pagamento recusado ou cancelado.");
      }
    }

    void checkStatus();
    const interval = window.setInterval(() => {
      void checkStatus();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [result?.payment_id, result?.status, router]);

  async function createPayment(payload: Record<string, unknown>) {
    const response = await fetch("/api/checkout/processar-pagamento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      router.replace("/login?next=/checkout");
      throw new Error("Sua sessao expirou.");
    }

    if (!response.ok) {
      throw new Error(data.error || "Nao foi possivel processar o pagamento.");
    }

    return data as CheckoutResult;
  }

  async function submitPix() {
    setError("");
    setLoading(true);
    setMessage("Gerando o PIX...");

    try {
      const payment = await createPayment({
        paymentType: "bank_transfer",
        paymentMethodId: "pix",
      });

      setResult(payment);
      if (payment.payment_id) {
        window.localStorage.setItem(LAST_PAYMENT_STORAGE_KEY, payment.payment_id);
      }

      if (payment.redirect_url) {
        window.location.assign(payment.redirect_url);
        return;
      }

      setMessage("PIX gerado. Agora e so pagar e aguardarmos a confirmacao.");
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Nao foi possivel gerar o PIX.");
      setMessage("Nao foi possivel gerar o PIX.");
    } finally {
      setLoading(false);
    }
  }

  async function submitCard() {
    setError("");
    setLoading(true);
    setMessage("Tokenizando o cartao...");

    try {
      const tokenResponse = await fetch("/api/checkout/tokenizar-cartao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardNumber: card.cardNumber,
          expirationMonth: card.expirationMonth,
          expirationYear: card.expirationYear,
          securityCode: card.securityCode,
        }),
      });
      const tokenPayload = (await tokenResponse.json().catch(() => ({}))) as Partial<TokenizeResult> & {
        error?: string;
      };

      if (!tokenResponse.ok) {
        throw new Error(tokenPayload.error || "Nao foi possivel tokenizar o cartao.");
      }

      setMessage("Enviando pagamento para o Mercado Pago...");
      const payment = await createPayment({
        paymentType: "credit_card",
        paymentMethodId: tokenPayload.paymentMethodId,
        token: tokenPayload.token,
        payer: {
          identification: { type: "CPF", number: digitsOnly(card.cpf) },
        },
      });

      setResult(payment);
      if (payment.payment_id) {
        window.localStorage.setItem(LAST_PAYMENT_STORAGE_KEY, payment.payment_id);
      }

      if (payment.redirect_url) {
        setMessage("Abrindo a autenticacao do cartao...");
        window.location.assign(payment.redirect_url);
        return;
      }

      if (payment.status === "approved") {
        window.localStorage.removeItem(LAST_PAYMENT_STORAGE_KEY);
        setMessage("Pagamento aprovado. Entrando na galeria...");
        router.replace("/galeria");
        router.refresh();
        return;
      }

      setMessage("Pagamento enviado. Estamos aguardando a confirmacao.");
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Nao foi possivel processar o cartao.");
      setMessage("Nao foi possivel processar o cartao.");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "pix") {
      await submitPix();
    } else {
      await submitCard();
    }
  }

  return (
    <div>
      {error || message ? (
        <div className="mb-4 rounded-xl border border-(--st-creme-border) bg-st-creme p-4 text-sm text-(--st-ink-mid)">
          {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
          <p className="mt-2 font-semibold text-(--st-ink-dark)">{message}</p>
          {loading ? <p className="mt-1 text-xs">Aguarde enquanto confirmamos os dados com o Mercado Pago.</p> : null}
          {result?.payment_id ? (
            <p className="mt-1 text-xs">
              <strong>Pagamento:</strong> {result.payment_id}
            </p>
          ) : null}
          {result?.purchase_id ? (
            <p className="mt-1 text-xs">
              <strong>Compra:</strong> {result.purchase_id}
            </p>
          ) : null}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-[var(--st-creme)] p-1">
          <button
            type="button"
            className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
              mode === "pix" ? "bg-white text-st-magenta shadow-sm" : "text-(--st-ink-mid)"
            }`}
            onClick={() => setMode("pix")}
          >
            PIX
          </button>
          <button
            type="button"
            className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
              mode === "card" ? "bg-white text-st-magenta shadow-sm" : "text-(--st-ink-mid)"
            }`}
            onClick={() => setMode("card")}
          >
            Cartao
          </button>
        </div>

        <div className="rounded-xl border border-(--st-creme-border) bg-white p-4 text-sm text-(--st-ink-mid)">
          <p className="font-semibold text-(--st-ink-dark)">Resumo do acesso</p>
          <p className="mt-1">Acesso vitalicio Sticke</p>
          <p className="font-mono-st mt-2 text-2xl font-medium text-st-magenta">
            R$ {STICKE_ACCESS_PRICE.toFixed(2).replace(".", ",")}
          </p>
          <p className="mt-1 text-xs">
            Entrar com <strong>{email}</strong>
          </p>
          {name ? (
            <p className="mt-1 text-xs">
              Nome da conta: <strong>{name}</strong>
            </p>
          ) : null}
        </div>

        {mode === "card" ? (
          <div className="space-y-3">
            <label className="block text-sm font-medium">
              Nome no cartao
              <input
                className="st-input mt-2"
                value={card.cardholderName}
                onChange={(event) => setCard((current) => ({ ...current, cardholderName: event.target.value }))}
                autoComplete="cc-name"
                required
              />
            </label>
            <label className="block text-sm font-medium">
              Numero do cartao
              <input
                className="st-input mt-2"
                inputMode="numeric"
                autoComplete="cc-number"
                value={card.cardNumber}
                onChange={(event) =>
                  setCard((current) => ({ ...current, cardNumber: digitsOnly(event.target.value) }))
                }
                required
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-sm font-medium">
                Mes
                <input
                  className="st-input mt-2"
                  inputMode="numeric"
                  placeholder="MM"
                  autoComplete="cc-exp-month"
                  value={card.expirationMonth}
                  onChange={(event) =>
                    setCard((current) => ({ ...current, expirationMonth: digitsOnly(event.target.value) }))
                  }
                  required
                />
              </label>
              <label className="block text-sm font-medium">
                Ano
                <input
                  className="st-input mt-2"
                  inputMode="numeric"
                  placeholder="YYYY"
                  autoComplete="cc-exp-year"
                  value={card.expirationYear}
                  onChange={(event) =>
                    setCard((current) => ({ ...current, expirationYear: digitsOnly(event.target.value) }))
                  }
                  required
                />
              </label>
              <label className="block text-sm font-medium">
                CVV
                <input
                  className="st-input mt-2"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  value={card.securityCode}
                  onChange={(event) =>
                    setCard((current) => ({ ...current, securityCode: digitsOnly(event.target.value) }))
                  }
                  required
                />
              </label>
            </div>
            <label className="block text-sm font-medium">
              CPF
              <input
                className="st-input mt-2"
                inputMode="numeric"
                value={card.cpf}
                onChange={(event) => setCard((current) => ({ ...current, cpf: digitsOnly(event.target.value) }))}
                required
              />
            </label>
          </div>
        ) : (
          <div className="rounded-xl border border-(--st-creme-border) bg-white p-4 text-sm text-(--st-ink-mid)">
            <p className="font-semibold text-(--st-ink-dark)">PIX instantaneo</p>
            <p className="mt-1 leading-6">
              Ao clicar em gerar PIX, criamos o pagamento e mostramos o QR Code nesta mesma tela.
            </p>
          </div>
        )}

        <button className="st-btn-primary w-full" disabled={loading}>
          {loading ? "Processando..." : mode === "pix" ? "Gerar PIX" : "Pagar com cartao"}
        </button>
      </form>

      {result?.qr_code ? (
        <div className="mt-6">
          <PixBlock qrCodeBase64={result.qr_code_base64 || ""} qrCode={result.qr_code} />
          <p className="mt-4 text-center text-sm leading-6 text-(--st-ink-mid)">
            Assim que o PIX for aprovado, entre na galeria com esta mesma conta.
          </p>
          <p className="mt-2 text-center text-xs text-(--st-ink-light)">
            Estamos verificando o pagamento automaticamente em segundo plano.
          </p>
          <button className="st-btn-primary mt-4 w-full" onClick={() => router.push("/galeria")}>
            Verificar meu acesso
          </button>
        </div>
      ) : null}

      <p className="mt-5 text-center text-xs leading-5 text-(--st-ink-light)">
        Os dados do cartao sao enviados diretamente ao Mercado Pago e nao ficam armazenados na Sticke.
      </p>
    </div>
  );
}
