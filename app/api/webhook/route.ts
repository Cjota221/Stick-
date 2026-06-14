import { NextRequest, NextResponse } from "next/server";
import { getPaymentClient } from "@/lib/mercadopago";
import { getSupabaseService } from "@/lib/supabase-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const paymentId = body?.data?.id ?? request.nextUrl.searchParams.get("data.id");
    if (body?.type === "payment" && paymentId) {
      const payment = await getPaymentClient().get({ id: String(paymentId) });
      if (payment.status === "approved" && payment.external_reference) {
        await getSupabaseService()
          .from("sticke_purchases")
          .update({ status: "approved", mp_payment_id: String(payment.id) })
          .eq("access_code", payment.external_reference);
      }
    }
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: true });
  }
}
