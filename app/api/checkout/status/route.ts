import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { reconcileMercadoPagoPayment } from "@/lib/payment-reconciliation";
import { getSupabaseService } from "@/lib/supabase-service";
import { debugLog, isDebugEnabled } from "@/lib/sticke-debug";

export async function GET(request: NextRequest) {
  const debug = isDebugEnabled(request.nextUrl.searchParams);
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  }

  const paymentId = request.nextUrl.searchParams.get("paymentId")?.trim() || "";
  if (!paymentId) {
    return NextResponse.json({ error: "paymentId ausente." }, { status: 400 });
  }

  let reconcileResult = null as Awaited<ReturnType<typeof reconcileMercadoPagoPayment>> | null;
  try {
    reconcileResult = await reconcileMercadoPagoPayment(paymentId);
  } catch (error) {
    if (debug) {
      debugLog("checkout-status:reconcile-error", {
        paymentId,
        message: error instanceof Error ? error.message : "unknown_error",
      });
    }
  }

  const service = getSupabaseService();
  const { data: purchase } = await service
    .from("sticke_purchases")
    .select("id,user_id,status,amount,mp_payment_id")
    .eq("mp_payment_id", paymentId)
    .maybeSingle();

  if (purchase && purchase.user_id && purchase.user_id !== user.id) {
    return NextResponse.json({ error: "Pagamento não pertence a esta conta." }, { status: 403 });
  }

  const { data: profile } = await service
    .from("sticke_profiles")
    .select("lifetime_access")
    .eq("id", user.id)
    .maybeSingle();

  const status =
    purchase?.status ||
    reconcileResult?.status ||
    (profile?.lifetime_access ? "approved" : "pending");

  if (debug) {
    debugLog("checkout-status", {
      userId: user.id,
      paymentId,
      status,
      purchaseId: purchase?.id ?? null,
      lifetimeAccess: Boolean(profile?.lifetime_access),
    });
  }

  return NextResponse.json({
    status,
    approved: status === "approved" || Boolean(profile?.lifetime_access),
    purchase_id: purchase?.id ?? null,
    lifetime_access: Boolean(profile?.lifetime_access),
    payment_id: paymentId,
    mp_status: reconcileResult?.status ?? null,
  });
}
