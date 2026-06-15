import { createBrowserClient } from "@supabase/ssr";

export function getSupabaseBrowser() {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key!,
  );
}
