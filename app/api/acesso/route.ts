import { NextRequest, NextResponse } from "next/server";
import { getPaymentClient } from "@/lib/mercadopago";
import { getSupabaseService } from "@/lib/supabase-service";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code")?.trim().toUpperCase();
    if (!code) return NextResponse.json({ error: "Código inválido" }, { status: 400 });

    const supabase = getSupabaseService();
    const { data: purchase } = await supabase
      .from("sticke_purchases")
      .select("id,access_code,status,mp_payment_id,pack_id,sticke_packs(id,name,description,cover_url,price)")
      .eq("access_code", code)
      .maybeSingle();
    if (!purchase) return NextResponse.json({ error: "Código inválido" }, { status: 404 });

    let status = purchase.status;
    if (status === "pending" && purchase.mp_payment_id && process.env.MERCADOPAGO_ACCESS_TOKEN) {
      const payment = await getPaymentClient().get({ id: purchase.mp_payment_id });
      if (payment.status === "approved") {
        status = "approved";
        await supabase.from("sticke_purchases").update({ status }).eq("id", purchase.id);
      } else if (payment.status === "rejected" || payment.status === "cancelled") {
        status = "rejected";
        await supabase.from("sticke_purchases").update({ status }).eq("id", purchase.id);
      }
    }

    let stickers = null;
    if (status === "approved") {
      const { data, error } = await supabase
        .from("sticke_stickers")
        .select("id,pack_id,name,image_url,sort_order")
        .eq("pack_id", purchase.pack_id)
        .order("sort_order");
      if (error) throw error;
      stickers = data;
    }
    return NextResponse.json({
      status,
      pack: purchase.sticke_packs,
      access_code: purchase.access_code,
      stickers,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao verificar acesso." },
      { status: 500 },
    );
  }
}
