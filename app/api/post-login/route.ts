import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { debugLog, isDebugEnabled } from "@/lib/sticke-debug";
import { getStickeAccessState } from "@/lib/sticke-access";

export async function GET() {
  const debug = isDebugEnabled();
  const user = await getAuthenticatedUser();
  if (!user) {
    if (debug) debugLog("post-login", { hasUser: false, destination: "/login" });
    return NextResponse.json({ destination: "/login" }, { status: 401 });
  }

  const access = await getStickeAccessState({ id: user.id, email: user.email });

  if (!access.hasAccess) {
    if (debug) {
      debugLog("post-login", {
        hasUser: true,
        userId: user.id,
        email: user.email ?? null,
        lifetimeAccess: access.lifetimeAccess,
        hasApprovedPurchase: access.hasApprovedPurchase,
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
      lifetimeAccess: access.lifetimeAccess,
      hasApprovedPurchase: access.hasApprovedPurchase,
      destination: "/galeria",
    });
  }
  return NextResponse.json({
    destination: "/galeria",
  });
}
