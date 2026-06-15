import { CardToken, MercadoPagoConfig, Payment } from "mercadopago";

export function getMPClient() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Mercado Pago nao configurado.");
  return new MercadoPagoConfig({ accessToken });
}

export function getPaymentClient() {
  return new Payment(getMPClient());
}

export function getCardTokenClient() {
  return new CardToken(getMPClient());
}

export function getMercadoPagoAccessToken() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Mercado Pago nao configurado.");
  return accessToken;
}

export function getMercadoPagoPublicKey() {
  const publicKey =
    process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || process.env.NEXT_PUBLIC_MP_PUBLISHABLE_KEY;
  if (!publicKey) throw new Error("Mercado Pago nao configurado.");
  return publicKey;
}
