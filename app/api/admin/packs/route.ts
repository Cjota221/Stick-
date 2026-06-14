import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { getSupabaseService } from "@/lib/supabase-service";

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  const { data, error } = await getSupabaseService()
    .from("sticke_packs")
    .select("*,sticke_stickers(count)")
    .order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    packs: (data ?? []).map((pack) => ({
      ...pack,
      price: Number(pack.price),
      sticker_count: pack.sticke_stickers?.[0]?.count ?? 0,
    })),
  });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  const body = await request.json();
  const { data, error } = await getSupabaseService()
    .from("sticke_packs")
    .insert(body)
    .select()
    .single();
  return error
    ? NextResponse.json({ error: error.message }, { status: 400 })
    : NextResponse.json({ pack: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  const { id, ...updates } = await request.json();
  const { data, error } = await getSupabaseService()
    .from("sticke_packs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return error
    ? NextResponse.json({ error: error.message }, { status: 400 })
    : NextResponse.json({ pack: data });
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  const id = request.nextUrl.searchParams.get("id");
  const { error } = await getSupabaseService().from("sticke_packs").delete().eq("id", id);
  return error
    ? NextResponse.json({ error: error.message }, { status: 400 })
    : NextResponse.json({ deleted: true });
}
