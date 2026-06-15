import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getSupabaseService } from "@/lib/supabase-service";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ destination: "/login" }, { status: 401 });
  }

  const { data: profile } = await getSupabaseService()
    .from("sticke_profiles")
    .select("lifetime_access")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    destination: profile?.lifetime_access ? "/galeria" : "/checkout",
  });
}
