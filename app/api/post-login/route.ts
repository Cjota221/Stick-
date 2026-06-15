import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getSupabaseService } from "@/lib/supabase-service";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ destination: "/login" }, { status: 401 });
  }

  const service = getSupabaseService();
  const [{ data: profile }, { data: purchase }] = await Promise.all([
    service
      .from("sticke_profiles")
      .select("lifetime_access")
      .eq("id", user.id)
      .maybeSingle(),
    service
      .from("sticke_purchases")
      .select("pack_id")
      .eq("email", user.email ?? "")
      .eq("status", "approved")
      .maybeSingle(),
  ]);

  if (!purchase && !profile?.lifetime_access) {
    return NextResponse.json({ destination: "/" });
  }

  return NextResponse.json({
    destination: "/galeria",
  });
}
