import { getSupabaseServer } from "@/lib/supabase-server";

export async function getAuthenticatedUser() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return error ? null : user;
}
