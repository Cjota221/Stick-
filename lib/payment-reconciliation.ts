import { getPaymentClient } from "@/lib/mercadopago";
import { STICKE_ACCESS_PRICE } from "@/lib/product";
import { getSupabaseService } from "@/lib/supabase-service";

type ReconcileResult = {
  received: true;
  paymentId: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  purchaseId: string | null;
  externalReference: string | null;
};

export async function reconcileMercadoPagoPayment(paymentId: string): Promise<ReconcileResult> {
  const payment = await getPaymentClient().get({ id: paymentId });
  const externalReference = payment.external_reference ? String(payment.external_reference) : null;
  const status =
    payment.status === "approved"
      ? "approved"
      : payment.status === "rejected" || payment.status === "cancelled"
        ? payment.status
        : "pending";

  if (!externalReference) {
    return {
      received: true,
      paymentId: String(payment.id),
      status,
      purchaseId: null,
      externalReference: null,
    };
  }

  const supabase = getSupabaseService();
  const { data: purchase } = await supabase
    .from("sticke_purchases")
    .update({
      status,
      mp_payment_id: String(payment.id),
      updated_at: new Date().toISOString(),
    })
    .eq("id", externalReference)
    .select("user_id,amount")
    .maybeSingle();

  if (
    status === "approved" &&
    purchase?.user_id &&
    Number(purchase.amount) === STICKE_ACCESS_PRICE &&
    Number(payment.transaction_amount) === STICKE_ACCESS_PRICE
  ) {
    await supabase
      .from("sticke_profiles")
      .update({ lifetime_access: true, updated_at: new Date().toISOString() })
      .eq("id", purchase.user_id);
  }

  return {
    received: true,
    paymentId: String(payment.id),
    status,
    purchaseId: externalReference,
    externalReference,
  };
}
