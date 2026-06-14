import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase-service";
import type { Pack } from "@/types/sticke";

export async function GET() {
  try {
    const supabase = getSupabaseService();
    const { data, error } = await supabase
      .from("sticke_packs")
      .select("id,name,description,cover_url,price,is_active,sort_order,sticke_stickers(count)")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw error;

    const packs: Pack[] = (data ?? []).map((pack) => ({
      id: pack.id,
      name: pack.name,
      description: pack.description,
      cover_url: pack.cover_url,
      price: Number(pack.price),
      is_active: pack.is_active,
      sort_order: pack.sort_order,
      sticker_count: pack.sticke_stickers?.[0]?.count ?? 0,
    }));
    return NextResponse.json({ packs });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar packs." },
      { status: 500 },
    );
  }
}
