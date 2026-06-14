import { MercadoPagoConfig, Payment } from "mercadopago";

export function getMPClient() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Mercado Pago não configurado.");
  return new MercadoPagoConfig({ accessToken });
}

export function getPaymentClient() {
  return new Payment(getMPClient());
}
