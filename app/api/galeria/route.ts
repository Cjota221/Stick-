import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getStoragePath } from "@/lib/storage";
import { getSupabaseService } from "@/lib/supabase-service";
import { debugLog, isDebugEnabled } from "@/lib/sticke-debug";

const STICKE_ADMIN_EMAIL = "carolineazeved075@gmail.com";

export async function GET(request: NextRequest) {
  const debug = isDebugEnabled(request.nextUrl.searchParams);
  const user = await getAuthenticatedUser();
  if (!user) {
    if (debug) debugLog("api/galeria", { hasUser: false, status: 401 });
    return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  }

  const email = user.email?.trim().toLowerCase() ?? "";
  const hasDirectAccess = email === STICKE_ADMIN_EMAIL;

  const supabase = getSupabaseService();
  const [{ data: profile }, { data: purchase }] = await Promise.all([
    supabase
      .from("sticke_profiles")
      .select("lifetime_access,name")
      .eq("id", user.id)
      .maybeSingle(),
    hasDirectAccess
      ? Promise.resolve({ data: null })
      : supabase
          .from("sticke_purchases")
          .select("id")
          .eq("email", user.email ?? "")
          .eq("status", "approved")
          .maybeSingle(),
  ]);

  const hasAccess = hasDirectAccess || Boolean(profile?.lifetime_access) || Boolean(purchase);
  if (debug) {
    debugLog("api/galeria", {
      hasUser: true,
      userId: user.id,
      email,
      hasDirectAccess,
      lifetimeAccess: Boolean(profile?.lifetime_access),
      hasApprovedPurchase: Boolean(purchase),
      hasAccess,
      categoryId: request.nextUrl.searchParams.get("category"),
    });
  }

  if (!hasAccess) {
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

  const { data: category } = await supabase
    .from("sticke_packs")
    .select("id,name")
    .eq("id", categoryId)
    .eq("is_active", true)
    .maybeSingle();
  if (!category) {
    return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });
  }

  const { data: stickers, error } = await supabase
    .from("sticke_stickers")
    .select("id,pack_id,name,image_url,sort_order")
    .eq("pack_id", categoryId)
    .order("sort_order")
    .order("name");
  if (error) {
    return NextResponse.json({ error: "Não foi possível carregar as figurinhas." }, { status: 500 });
  }

  const paths = (stickers ?? []).map((sticker) => getStoragePath(sticker.image_url));
  const signedByPath = new Map<string, string>();
  for (let start = 0; start < paths.length; start += 100) {
    const page = paths.slice(start, start + 100);
    const { data: signed, error: signedError } = await supabase.storage
      .from("sticke-assets")
      .createSignedUrls(page, 15 * 60);
    if (signedError) {
      return NextResponse.json({ error: "Não foi possível liberar as imagens." }, { status: 500 });
    }
    signed?.forEach((item) => {
      if (item.path && item.signedUrl) signedByPath.set(item.path, item.signedUrl);
    });
  }

  return NextResponse.json({
    category,
    stickers: (stickers ?? [])
      .map((sticker, index) => ({
        ...sticker,
        image_url: signedByPath.get(paths[index]) || "",
      }))
      .filter((sticker) => sticker.image_url),
  });
}
