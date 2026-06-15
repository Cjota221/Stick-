import { redirect } from "next/navigation";
import GalleryClient from "@/components/GalleryClient";
import { getAuthenticatedUser } from "@/lib/auth";
import { getSupabaseService } from "@/lib/supabase-service";

export default async function GaleriaPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const service = getSupabaseService();
  const [{ data: profile }, { data: purchase }] = await Promise.all([
    service
      .from("sticke_profiles")
      .select("name,lifetime_access")
      .eq("id", user.id)
      .maybeSingle(),
    service
      .from("sticke_purchases")
      .select("pack_id")
      .eq("email", user.email ?? "")
      .eq("status", "approved")
      .maybeSingle(),
  ]);

  if (!purchase && !profile?.lifetime_access) redirect("/");

  return <GalleryClient customerName={profile?.name || ""} />;
}
