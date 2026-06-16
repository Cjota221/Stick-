import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getStoragePath } from "@/lib/storage";
import { getSupabaseService } from "@/lib/supabase-service";
import { debugLog, isDebugEnabled } from "@/lib/sticke-debug";
import { getStickeAccessState } from "@/lib/sticke-access";

type SignedSticker = {
  id: string;
  pack_id: string;
  name: string | null;
  image_url: string;
  sort_order: number;
};

async function signStickerImages(
  supabase: ReturnType<typeof getSupabaseService>,
  stickers: SignedSticker[],
) {
  const paths = stickers.map((sticker) => getStoragePath(sticker.image_url));
  const signedByPath = new Map<string, string>();

  for (let start = 0; start < paths.length; start += 100) {
    const page = paths.slice(start, start + 100);
    const { data: signed, error } = await supabase.storage
      .from("sticke-assets")
      .createSignedUrls(page, 15 * 60);
    if (error) {
      throw new Error("Não foi possível liberar as imagens.");
    }

    signed?.forEach((item) => {
      if (item.path && item.signedUrl) signedByPath.set(item.path, item.signedUrl);
    });
  }

  return stickers
    .map((sticker, index) => ({
      ...sticker,
      image_url: signedByPath.get(paths[index]) || "",
    }))
    .filter((sticker) => sticker.image_url);
}

export async function GET(request: NextRequest) {
  const debug = isDebugEnabled(request.nextUrl.searchParams);
  const user = await getAuthenticatedUser();
  if (!user) {
    if (debug) debugLog("api/galeria", { hasUser: false, status: 401 });
    return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  }

  const access = await getStickeAccessState({ id: user.id, email: user.email });
  const supabase = getSupabaseService();

  if (debug) {
    debugLog("api/galeria", {
      hasUser: true,
      userId: user.id,
      email: access.email,
      hasDirectAccess: access.hasDirectAccess,
      lifetimeAccess: access.lifetimeAccess,
      hasApprovedPurchase: access.hasApprovedPurchase,
      hasAccess: access.hasAccess,
      categoryId: request.nextUrl.searchParams.get("category"),
    });
  }

  if (!access.hasAccess) {
    return NextResponse.json({ error: "Pagamento ainda não aprovado." }, { status: 403 });
  }

  const categoryId = request.nextUrl.searchParams.get("category");
  if (!categoryId) {
    const { data, error } = await supabase
      .from("sticke_packs")
      .select("id,name,description,sort_order,sticke_stickers(count)")
      .eq("is_active", true)
      .order("sort_order")
      .order("name");
    if (error) {
      return NextResponse.json({ error: "Não foi possível carregar as categorias." }, { status: 500 });
    }
    return NextResponse.json({
      categories: (data ?? []).map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        sort_order: category.sort_order,
        sticker_count: category.sticke_stickers?.[0]?.count ?? 0,
      })),
    });
  }

  if (categoryId === "all") {
    const { data: packs, error: packsError } = await supabase
      .from("sticke_packs")
      .select("id,sort_order")
      .eq("is_active", true)
      .order("sort_order")
      .order("name");
    if (packsError) {
      return NextResponse.json({ error: "Não foi possível carregar as figurinhas." }, { status: 500 });
    }

    const packIds = (packs ?? []).map((pack) => pack.id);
    if (!packIds.length) {
      return NextResponse.json({ stickers: [] });
    }

    const { data: allStickers, error } = await supabase
      .from("sticke_stickers")
      .select("id,pack_id,name,image_url,sort_order")
      .in("pack_id", packIds);
    if (error) {
      return NextResponse.json({ error: "Não foi possível carregar as figurinhas." }, { status: 500 });
    }

    const packOrder = new Map((packs ?? []).map((pack, index) => [pack.id, index]));
    const sortedStickers = [...(allStickers ?? [])].sort((left, right) => {
      const packDelta = (packOrder.get(left.pack_id) ?? 0) - (packOrder.get(right.pack_id) ?? 0);
      if (packDelta !== 0) return packDelta;
      if (left.sort_order !== right.sort_order) return left.sort_order - right.sort_order;
      return (left.name ?? "").localeCompare(right.name ?? "", "pt-BR");
    });

    try {
      const stickers = await signStickerImages(supabase, sortedStickers);
      return NextResponse.json({ stickers });
    } catch {
      return NextResponse.json({ error: "Não foi possível liberar as imagens." }, { status: 500 });
    }
  }

  const { data: category } = await supabase
    .from("sticke_packs")
    .select("id,name")
    .eq("id", categoryId)
    .eq("is_active", true)
    .maybeSingle();
  if (!category) {
    return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });
  }

  const { data: stickersRaw, error } = await supabase
    .from("sticke_stickers")
    .select("id,pack_id,name,image_url,sort_order")
    .eq("pack_id", categoryId)
    .order("sort_order")
    .order("name");
  if (error) {
    return NextResponse.json({ error: "Não foi possível carregar as figurinhas." }, { status: 500 });
  }

  try {
    const stickers = await signStickerImages(supabase, stickersRaw ?? []);
    return NextResponse.json({ category, stickers });
  } catch {
    return NextResponse.json({ error: "Não foi possível liberar as imagens." }, { status: 500 });
  }
}
