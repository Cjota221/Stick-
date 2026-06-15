import { NextRequest, NextResponse } from "next/server";
import { debugLog, isDebugEnabled } from "@/lib/sticke-debug";
import { reconcileMercadoPagoPayment } from "@/lib/payment-reconciliation";

export async function POST(request: NextRequest) {
  const debug = isDebugEnabled(request.nextUrl.searchParams);
  const body = await request.json().catch(() => ({}));
  const paymentId = String(body?.data?.id || request.nextUrl.searchParams.get("data.id") || "");

  if (!paymentId) {
    if (debug) debugLog("webhook", { paymentId: null, status: "ignored" });
    return NextResponse.json({ received: true });
  }

  try {
    const result = await reconcileMercadoPagoPayment(paymentId);
    if (debug) {
      debugLog("webhook", {
        paymentId,
        status: result.status,
        purchaseId: result.purchaseId,
        externalReference: result.externalReference,
      });
    }
  } catch (error) {
    if (debug) {
      debugLog("webhook:error", {
        paymentId,
        message: error instanceof Error ? error.message : "unknown_error",
      });
    }
  }

  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
