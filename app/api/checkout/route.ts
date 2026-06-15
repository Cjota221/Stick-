import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getPaymentClient } from "@/lib/mercadopago";
import { STICKE_ACCESS_PRICE, STICKE_PRODUCT_NAME } from "@/lib/product";
import { getSupabaseService } from "@/lib/supabase-service";

type CheckoutPayload = {
  paymentType?: string;
  formData?: {
    token?: string;
    issuer_id?: string | number;
    payment_method_id?: string;
    payer?: {
      identification?: { type?: string; number?: string };
    };
  };
};

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Entre na sua conta para pagar." }, { status: 401 });
    }

    const payload = (await request.json()) as CheckoutPayload;
    const formData = payload.formData ?? {};
    const paymentMethodId = String(formData.payment_method_id || "");
    if (!paymentMethodId) {
      return NextResponse.json({ error: "Escolha uma forma de pagamento." }, { status: 400 });
    }

    const isPix = paymentMethodId === "pix" || payload.paymentType === "bank_transfer";
    if (!isPix && !formData.token) {
      return NextResponse.json({ error: "Os dados do cartão não foram tokenizados." }, { status: 400 });
    }

    const supabase = getSupabaseService();
    const { data: profile } = await supabase
      .from("sticke_profiles")
      .select("lifetime_access")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.lifetime_access) {
      return NextResponse.json({ status: "approved", already_active: true });
    }

    const { data: purchase, error: purchaseError } = await supabase
      .from("sticke_purchases")
      .insert({
        user_id: user.id,
        email: user.email,
        amount: STICKE_ACCESS_PRICE,
        payment_method: paymentMethodId,
        status: "pending",
      })
      .select("id")
      .single();
    if (purchaseError || !purchase) throw purchaseError || new Error("Compra não criada.");

    const issuerId = Number(formData.issuer_id);
    const payment = await getPaymentClient().create({
      body: {
        transaction_amount: STICKE_ACCESS_PRICE,
        description: STICKE_PRODUCT_NAME,
        installments: 1,
        token: isPix ? undefined : formData.token,
        issuer_id: Number.isFinite(issuerId) ? issuerId : undefined,
        payment_method_id: paymentMethodId,
        external_reference: purchase.id,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/mercadopago`,
        payer: {
          email: user.email,
          identification: formData.payer?.identification,
        },
        additional_info: {
          ip_address:
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
          items: [
            {
              id: "sticke-lifetime",
              title: STICKE_PRODUCT_NAME,
              quantity: 1,
              unit_price: STICKE_ACCESS_PRICE,
            },
          ],
        },
      },
      requestOptions: { idempotencyKey: purchase.id },
    });

    const normalizedStatus =
      payment.status === "approved"
        ? "approved"
        : payment.status === "rejected" || payment.status === "cancelled"
          ? payment.status
          : "pending";

    await supabase
      .from("sticke_purchases")
      .update({
        mp_payment_id: payment.id ? String(payment.id) : null,
        status: normalizedStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", purchase.id);

    if (
      normalizedStatus === "approved" &&
      Number(payment.transaction_amount) === STICKE_ACCESS_PRICE
    ) {
      await supabase
        .from("sticke_profiles")
        .update({ lifetime_access: true, updated_at: new Date().toISOString() })
        .eq("id", user.id);
    }

    return NextResponse.json({
      status: normalizedStatus,
      status_detail: payment.status_detail,
      purchase_id: purchase.id,
      payment_id: payment.id ? String(payment.id) : "",
      qr_code: payment.point_of_interaction?.transaction_data?.qr_code ?? "",
      qr_code_base64:
        payment.point_of_interaction?.transaction_data?.qr_code_base64 ?? "",
      redirect_url: payment.three_ds_info?.external_resource_url ?? "",
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível processar o pagamento. Confira os dados e tente novamente." },
      { status: 500 },
    );
  }
}
