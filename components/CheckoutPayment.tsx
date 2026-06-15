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
        setError(payload.error || "Este pagamento não pertence a esta conta.");
        return;
      }

      if (payload.status === "approved") {
        window.localStorage.removeItem(LAST_PAYMENT_STORAGE_KEY);
        router.replace("/galeria");
        router.refresh();
        return;
      }

      if (payload.status === "rejected" || payload.status === "cancelled") {
        setError("O pagamento foi recusado ou cancelado.");
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
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const payload = await response.json();
    if (response.status === 401) {
      router.replace("/login?next=/checkout");
      throw new Error("Sua sessão expirou.");
    }
    if (!response.ok) {
      const message = payload.error || "Não foi possível processar o pagamento.";
      setError(message);
      throw new Error(message);
    }

    setResult(payload);
    if (payload.payment_id) {
      window.localStorage.setItem(LAST_PAYMENT_STORAGE_KEY, payload.payment_id);
    }
    if (payload.redirect_url) {
      window.location.assign(payload.redirect_url);
      return;
    }
    if (payload.status === "approved") {
      window.localStorage.removeItem(LAST_PAYMENT_STORAGE_KEY);
      router.replace("/galeria");
      router.refresh();
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
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <Payment
        initialization={initialization}
        customization={{
          paymentMethods: {
            creditCard: "all",
            bankTransfer: "all",
            maxInstallments: 1,
            minInstallments: 1,
            types: { included: ["creditCard", "bank_transfer"] },
          },
          visual: {
            style: { theme: "default" },
            defaultPaymentOption: { creditCardForm: true },
          },
        }}
        locale="pt-BR"
        onSubmit={submit}
        onError={() => setError("Não foi possível carregar a forma de pagamento.")}
      />
      <p className="mt-5 text-center text-xs leading-5 text-[var(--st-ink-light)]">
        Os dados do cartão são enviados diretamente ao Mercado Pago e não ficam armazenados na Stickê.
      </p>
    </div>
  );
}
