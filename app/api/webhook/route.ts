import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getPaymentClient } from "@/lib/mercadopago";
import { STICKE_ACCESS_PRICE } from "@/lib/product";
import { getSupabaseService } from "@/lib/supabase-service";

function validSignature(request: NextRequest, dataId: string) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const signature = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  if (!secret || !signature || !requestId) return false;

  const parts = Object.fromEntries(
    signature.split(",").map((part) => {
      const [key, value] = part.trim().split("=", 2);
      return [key, value];
    }),
  );
  if (!parts.ts || !parts.v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${parts.ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  const received = parts.v1.toLowerCase();
  if (expected.length !== received.length) return false;

  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const paymentId = String(body?.data?.id || request.nextUrl.searchParams.get("data.id") || "");
  if (!paymentId || !validSignature(request, paymentId)) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  try {
    const payment = await getPaymentClient().get({ id: paymentId });
    const purchaseId = payment.external_reference;
    if (!purchaseId) return NextResponse.json({ received: true });

    const status =
      payment.status === "approved"
        ? "approved"
        : payment.status === "rejected" || payment.status === "cancelled"
          ? payment.status
          : "pending";
    const supabase = getSupabaseService();
    const { data: purchase } = await supabase
      .from("sticke_purchases")
      .update({
        status,
        mp_payment_id: String(payment.id),
        updated_at: new Date().toISOString(),
      })
      .eq("id", purchaseId)
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

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Falha temporária." }, { status: 500 });
  }
}
