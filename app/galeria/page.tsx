import { redirect } from "next/navigation";
import GalleryClient from "@/components/GalleryClient";
import { getAuthenticatedUser } from "@/lib/auth";
import { getSupabaseService } from "@/lib/supabase-service";

export default async function GaleriaPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login?next=/galeria");

  const { data: profile } = await getSupabaseService()
    .from("sticke_profiles")
    .select("name,lifetime_access")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.lifetime_access) redirect("/checkout");

  return <GalleryClient customerName={profile.name} />;
}
