import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getSupabaseService } from "@/lib/supabase-service";

type LoginPayload = {
  email?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as LoginPayload;
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!email.includes("@") || !password) {
    return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 500 });
  }

  const cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }> = [];
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (newCookies: Array<{ name: string; value: string; options: CookieOptions }>) => {
        cookiesToSet.push(...newCookies);
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message || "Unable to sign in." },
      { status: 401 },
    );
  }

  const service = getSupabaseService();
  const [{ data: profile }, { data: purchase }] = await Promise.all([
    service
      .from("sticke_profiles")
      .select("lifetime_access")
      .eq("id", data.user.id)
      .maybeSingle(),
    service
      .from("sticke_purchases")
      .select("pack_id")
      .eq("email", data.user.email ?? email)
      .eq("status", "approved")
      .maybeSingle(),
  ]);

  const response = NextResponse.json({
    ok: true,
    destination: purchase || profile?.lifetime_access ? "/galeria" : "/",
  });

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}
