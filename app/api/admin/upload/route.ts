import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { getSupabaseService } from "@/lib/supabase-service";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const formData = await request.formData();
  const file = formData.get("file");
  const folder = String(formData.get("folder") || "uploads").replace(/[^a-z0-9-_]/gi, "");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo obrigatório." }, { status: 400 });
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Use JPG, PNG ou WebP de até 10 MB." }, { status: 400 });
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${folder}/${randomUUID()}.${extension}`;
  const supabase = getSupabaseService();
  const { error } = await supabase.storage
    .from("sticke-assets")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const { data } = supabase.storage.from("sticke-assets").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
