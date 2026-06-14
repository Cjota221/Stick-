import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getPaymentClient } from "@/lib/mercadopago";
import { getSupabaseService } from "@/lib/supabase-service";

export async function POST(request: NextRequest) {
  try {
    const { email, packId } = await request.json();
    if (!email || !packId) {
      return NextResponse.json({ error: "Email e pack são obrigatórios." }, { status: 400 });
    }

    const supabase = getSupabaseService();
    const { data: pack, error: packError } = await supabase
      .from("sticke_packs")
      .select("id,name,price,is_active")
      .eq("id", packId)
      .eq("is_active", true)
      .single();
    if (packError || !pack) {
      return NextResponse.json({ error: "Pack indisponível." }, { status: 404 });
    }

    const accessCode = randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase();
    const { error: purchaseError } = await supabase.from("sticke_purchases").insert({
      email: String(email).trim().toLowerCase(),
      pack_id: pack.id,
      access_code: accessCode,
      status: "pending",
    });
    if (purchaseError) throw purchaseError;

    const payment = await getPaymentClient().create({
      body: {
        transaction_amount: Number(pack.price),
        description: `Stickê - ${pack.name}`,
        payment_method_id: "pix",
        external_reference: accessCode,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook`,
        payer: { email: String(email).trim().toLowerCase() },
      },
    });
    if (!payment.id) throw new Error("O Mercado Pago não retornou o pagamento.");

    await supabase
      .from("sticke_purchases")
      .update({ mp_payment_id: String(payment.id) })
      .eq("access_code", accessCode);

    return NextResponse.json({
      access_code: accessCode,
      payment_id: String(payment.id),
      qr_code: payment.point_of_interaction?.transaction_data?.qr_code ?? "",
      qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64 ?? "",
      price: Number(pack.price),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível gerar o PIX." },
      { status: 500 },
    );
  }
}
