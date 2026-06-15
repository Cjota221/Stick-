"use client";

import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { useRouter } from "next/navigation";
import { type ComponentProps, useEffect, useMemo, useState } from "react";
import PixBlock from "@/components/PixBlock";
import { STICKE_ACCESS_PRICE } from "@/lib/product";

type PaymentSubmission = Parameters<
  NonNullable<ComponentProps<typeof Payment>["onSubmit"]>
>[0];

type CheckoutResult = {
  status: "pending" | "approved" | "rejected" | "cancelled";
  purchase_id?: string;
  payment_id?: string;
  qr_code?: string;
  qr_code_base64?: string;
  redirect_url?: string;
};

let mercadoPagoInitialized = false;
const LAST_PAYMENT_STORAGE_KEY = "sticke:lastPaymentId";

export default function CheckoutPayment({ email, name }: { email: string; name: string }) {
  const router = useRouter();
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("Preencha os dados e conclua o pagamento.");
  const [submitting, setSubmitting] = useState(false);
  const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

  if (publicKey && !mercadoPagoInitialized) {
    initMercadoPago(publicKey, { locale: "pt-BR" });
    mercadoPagoInitialized = true;
  }

  const initialization = useMemo(
    () => ({
      amount: STICKE_ACCESS_PRICE,
      payer: { email, firstName: name },
    }),
    [email, name],
  );

  useEffect(() => {
    const savedPaymentId = window.localStorage.getItem(LAST_PAYMENT_STORAGE_KEY);
    if (savedPaymentId) {
      setResult({ status: "pending", payment_id: savedPaymentId });
      setStatusMessage("Encontramos um pagamento anterior e estamos verificando o status.");
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
        setStatusMessage("Este pagamento nao pertence a esta conta.");
        return;
      }

      if (payload.status === "approved") {
        window.localStorage.removeItem(LAST_PAYMENT_STORAGE_KEY);
        setStatusMessage("Pagamento aprovado. Entrando na galeria...");
        router.replace("/galeria");
        router.refresh();
        return;
      }

      if (payload.status === "rejected" || payload.status === "cancelled") {
        setError("O pagamento foi recusado ou cancelado.");
        setStatusMessage("Pagamento recusado ou cancelado.");
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

  async function submit(data: PaymentSubmission) {
    setError("");
    setSubmitting(true);
    setStatusMessage("Enviando pagamento para o Mercado Pago...");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = await response.json();

      if (response.status === 401) {
        router.replace("/login?next=/checkout");
        throw new Error("Sua sessao expirou.");
      }
      if (!response.ok) {
        const message = payload.error || "Nao foi possivel processar o pagamento.";
        setError(message);
        setStatusMessage("Nao conseguimos processar o pagamento.");
        throw new Error(message);
      }

      setResult(payload);
      if (payload.payment_id) {
        window.localStorage.setItem(LAST_PAYMENT_STORAGE_KEY, payload.payment_id);
      }

      if (payload.redirect_url) {
        setStatusMessage("Abrindo a etapa de autenticacao do cartao...");
        window.location.assign(payload.redirect_url);
        return;
      }

      if (payload.status === "approved") {
        window.localStorage.removeItem(LAST_PAYMENT_STORAGE_KEY);
        setStatusMessage("Pagamento aprovado. Entrando na galeria...");
        router.replace("/galeria");
        router.refresh();
      } else if (payload.status === "pending") {
        setStatusMessage("Pagamento enviado. Estamos aguardando a confirmacao.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!publicKey) {
    return (
      <p className="rounded-xl bg-red-50 p-4 text-sm text-red-800">
        Configure NEXT_PUBLIC_MP_PUBLIC_KEY para habilitar o checkout.
      </p>
    );
  }

  if (result?.qr_code) {
    return (
      <div>
        <div className="mb-4 rounded-xl border border-[var(--st-creme-border)] bg-white p-4 text-sm text-[var(--st-ink-mid)]">
          <p className="font-semibold text-[var(--st-ink-dark)]">{statusMessage}</p>
          <p className="mt-1 text-xs">
            <strong>Compra:</strong> {result.purchase_id || "pendente"} ·{" "}
            <strong>Pagamento:</strong> {result.payment_id || "pendente"}
          </p>
        </div>
        <PixBlock
          qrCodeBase64={result.qr_code_base64 || ""}
          qrCode={result.qr_code}
        />
        <p className="mt-4 text-center text-sm leading-6 text-[var(--st-ink-mid)]">
          Assim que o PIX for aprovado, entre na galeria com esta mesma conta.
        </p>
        <p className="mt-2 text-center text-xs text-[var(--st-ink-light)]">
          Estamos verificando o pagamento automaticamente em segundo plano.
        </p>
        <button className="st-btn-primary mt-4 w-full" onClick={() => router.push("/galeria")}>
          Verificar meu acesso
        </button>
      </div>
    );
  }

  return (
    <div>
      {(error || statusMessage) && (
        <div className="mb-4 rounded-xl border border-[var(--st-creme-border)] bg-[var(--st-creme)] p-4 text-sm text-[var(--st-ink-mid)]">
          {error ? (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>
          ) : null}
          <p className="mt-2 font-semibold text-[var(--st-ink-dark)]">{statusMessage}</p>
          {submitting && <p className="mt-1 text-xs">Aguarde enquanto confirmamos os dados com o Mercado Pago.</p>}
          {result?.payment_id && (
            <p className="mt-1 text-xs">
              <strong>Pagamento:</strong> {result.payment_id}
            </p>
          )}
          {result?.purchase_id && (
            <p className="mt-1 text-xs">
              <strong>Compra:</strong> {result.purchase_id}
            </p>
          )}
        </div>
      )}
      <Payment
        initialization={initialization}
        customization={{
          paymentMethods: {
            creditCard: "all",
            bankTransfer: "all",
            debitCard: "all",
            ticket: "all",
            mercadoPago: "all",
            maxInstallments: 1,
            minInstallments: 1,
          },
          visual: {
            style: { theme: "default" },
            defaultPaymentOption: { creditCardForm: true },
          },
        }}
        locale="pt-BR"
        onSubmit={submit}
        onReady={() => setStatusMessage("Checkout pronto para pagamento.")}
        onError={() => {
          setSubmitting(false);
          setError("Nao foi possivel carregar a forma de pagamento.");
          setStatusMessage("O checkout encontrou um problema ao carregar.");
        }}
      />
      <p className="mt-5 text-center text-xs leading-5 text-[var(--st-ink-light)]">
        Os dados do cartao sao enviados diretamente ao Mercado Pago e nao ficam armazenados na Sticke.
      </p>
    </div>
  );
}
