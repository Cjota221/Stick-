import { redirect } from "next/navigation";
import GalleryClient from "@/components/GalleryClient";
import { getAuthenticatedUser } from "@/lib/auth";
import { debugLog, isDebugEnabled } from "@/lib/sticke-debug";
import { getStickeAccessState } from "@/lib/sticke-access";

export default async function GaleriaPage() {
  const debug = isDebugEnabled();
  const user = await getAuthenticatedUser();
  if (debug) {
    debugLog("galeria:start", {
      hasUser: Boolean(user),
      userId: user?.id ?? null,
      email: user?.email ?? null,
    });
  }
  if (!user) redirect("/login");

  const access = await getStickeAccessState({ id: user.id, email: user.email });

  if (debug) {
    debugLog("galeria:access", {
      userId: user.id,
      email: access.email,
      lifetimeAccess: access.lifetimeAccess,
      hasApprovedPurchase: access.hasApprovedPurchase,
    });
  }

  if (!access.hasAccess) redirect("/");

  return <GalleryClient customerName={user.user_metadata?.name?.toString() || ""} />;
}
