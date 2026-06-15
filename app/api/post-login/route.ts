import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getSupabaseService } from "@/lib/supabase-service";
import { debugLog, isDebugEnabled } from "@/lib/sticke-debug";

export async function GET() {
  const debug = isDebugEnabled();
  const user = await getAuthenticatedUser();
  if (!user) {
    if (debug) debugLog("post-login", { hasUser: false, destination: "/login" });
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
    if (debug) {
      debugLog("post-login", {
        hasUser: true,
        userId: user.id,
        email: user.email ?? null,
        lifetimeAccess: Boolean(profile?.lifetime_access),
        hasApprovedPurchase: Boolean(purchase),
        destination: "/",
      });
    }
    return NextResponse.json({ destination: "/" });
  }

  if (debug) {
    debugLog("post-login", {
      hasUser: true,
      userId: user.id,
      email: user.email ?? null,
      lifetimeAccess: Boolean(profile?.lifetime_access),
      hasApprovedPurchase: Boolean(purchase),
      destination: "/galeria",
    });
  }
  return NextResponse.json({
    destination: "/galeria",
  });
}
