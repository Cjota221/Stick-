import { NextRequest, NextResponse } from "next/server";
import { getCardTokenClient, getMercadoPagoAccessToken, getMercadoPagoPublicKey } from "@/lib/mercadopago";

type TokenizePayload = {
  cardNumber?: string;
  expirationMonth?: string;
  expirationYear?: string;
  securityCode?: string;
};

function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

function pickPaymentMethodId(results: Array<{ id?: string; payment_type_id?: string }>) {
  const priority = [
    "visa",
    "master",
    "elo",
    "amex",
    "hipercard",
    "diners",
    "cabal",
    "naranja",
    "debvisa",
    "debmaster",
    "debelo",
  ];

  const ranked = results
    .filter((item) => item.id && priority.includes(item.id))
    .sort((left, right) => priority.indexOf(left.id || "") - priority.indexOf(right.id || ""));

  return (
    ranked[0]?.id ||
    results.find((item) => item.payment_type_id === "credit_card")?.id ||
    results.find((item) => item.payment_type_id === "debit_card")?.id ||
    results[0]?.id ||
    ""
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as TokenizePayload;
    const cardNumber = normalizeDigits(String(body.cardNumber || ""));
    const expirationMonth = normalizeDigits(String(body.expirationMonth || "")).padStart(2, "0");
    const expirationYear = String(body.expirationYear || "").trim();
    const securityCode = normalizeDigits(String(body.securityCode || ""));

    if (cardNumber.length < 13) {
      return NextResponse.json({ error: "Numero do cartao invalido." }, { status: 400 });
    }
    if (!expirationMonth || !expirationYear || !securityCode) {
      return NextResponse.json({ error: "Preencha validade e CVV." }, { status: 400 });
    }

    const bin = cardNumber.slice(0, 6);
    const publicKey = getMercadoPagoPublicKey();
    const accessToken = getMercadoPagoAccessToken();

    const binResponse = await fetch(
      `https://api.mercadopago.com/v1/payment_methods/search?bin=${encodeURIComponent(bin)}&public_key=${encodeURIComponent(publicKey)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    const binPayload = await binResponse.json().catch(() => ({}));
    const results = Array.isArray(binPayload?.results) ? binPayload.results : [];
    const paymentMethodId = pickPaymentMethodId(results);

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: "Nao foi possivel identificar a bandeira do cartao." },
        { status: 400 },
      );
    }

    const token = await getCardTokenClient().create({
      body: {
        card_number: cardNumber,
        expiration_month: expirationMonth,
        expiration_year: expirationYear.length === 2 ? `20${expirationYear}` : expirationYear,
        security_code: securityCode,
      },
    });

    if (!token.id) {
      return NextResponse.json(
        { error: "Nao foi possivel gerar o token do cartao." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      token: token.id,
      paymentMethodId,
      cardLast4: cardNumber.slice(-4),
      bin,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel tokenizar o cartao.",
      },
      { status: 500 },
    );
  }
}
