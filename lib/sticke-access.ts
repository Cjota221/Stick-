import { getSupabaseService } from "@/lib/supabase-service";

const STICKE_ADMIN_EMAIL = "carolineazeved075@gmail.com";

type AccessUser = {
  id: string;
  email?: string | null;
};

export type StickeAccessState = {
  email: string;
  hasDirectAccess: boolean;
  lifetimeAccess: boolean;
  hasApprovedPurchase: boolean;
  hasAccess: boolean;
};

export async function getStickeAccessState(user: AccessUser): Promise<StickeAccessState> {
  const email = user.email?.trim().toLowerCase() ?? "";
  const hasDirectAccess = email === STICKE_ADMIN_EMAIL;

  const service = getSupabaseService();
  const { data: profile } = await service
    .from("sticke_profiles")
    .select("lifetime_access")
    .eq("id", user.id)
    .maybeSingle();

  let hasApprovedPurchase = false;
  if (!hasDirectAccess) {
    const byUserId = await service
      .from("sticke_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (byUserId.data) {
      hasApprovedPurchase = true;
    } else if (email) {
      const byEmail = await service
        .from("sticke_purchases")
        .select("id")
        .eq("email", email)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      hasApprovedPurchase = Boolean(byEmail.data);
    }
  }

  const lifetimeAccess = hasDirectAccess || Boolean(profile?.lifetime_access);
  const hasAccess = lifetimeAccess || hasApprovedPurchase;

  return {
    email,
    hasDirectAccess,
    lifetimeAccess,
    hasApprovedPurchase,
    hasAccess,
  };
}
