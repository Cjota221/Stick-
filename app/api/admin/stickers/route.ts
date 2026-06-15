import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { getStoragePath } from "@/lib/storage";
import { getSupabaseService } from "@/lib/supabase-service";

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  const packId = request.nextUrl.searchParams.get("pack_id");
  const supabase = getSupabaseService();
  let query = supabase.from("sticke_stickers").select("*").order("sort_order");
  if (packId) query = query.eq("pack_id", packId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const paths = (data ?? []).map((sticker) => getStoragePath(sticker.image_url));
  const { data: signed } = paths.length
    ? await supabase.storage.from("sticke-assets").createSignedUrls(paths, 15 * 60)
    : { data: [] };
  const signedByPath = new Map(
    (signed ?? [])
      .filter((item) => item.path && item.signedUrl)
      .map((item) => [item.path as string, item.signedUrl as string]),
  );
  return NextResponse.json({
    stickers: (data ?? []).map((sticker, index) => ({
      ...sticker,
      image_url: signedByPath.get(paths[index]) || "",
    })),
  });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  const body = await request.json();
  const { data, error } = await getSupabaseService()
    .from("sticke_stickers")
    .insert(body)
    .select()
    .single();
  return error
    ? NextResponse.json({ error: error.message }, { status: 400 })
    : NextResponse.json({ sticker: data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  const id = request.nextUrl.searchParams.get("id");
  const { error } = await getSupabaseService().from("sticke_stickers").delete().eq("id", id);
  return error
    ? NextResponse.json({ error: error.message }, { status: 400 })
    : NextResponse.json({ deleted: true });
}
