import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getSupabaseService } from "@/lib/supabase-service";
import { debugLog, isDebugEnabled } from "@/lib/sticke-debug";

type LoginPayload = {
  email?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  const STICKE_ADMIN_EMAIL = "carolineazeved075@gmail.com";
  const body = (await request.json().catch(() => ({}))) as LoginPayload;
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const debug = isDebugEnabled(request.nextUrl.searchParams);

  if (debug) {
    debugLog("login:start", {
      email,
      hasPassword: Boolean(password),
      hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasSupabaseKey: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      ),
    });
  }

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
    if (debug) debugLog("login:error", { email, message: error?.message ?? "sign_in_failed" });
    return NextResponse.json(
      { error: error?.message || "Unable to sign in." },
      { status: 401 },
    );
  }
  if (debug) {
    debugLog("login:success", {
      userId: data.user.id,
      email: data.user.email ?? email,
    });
  }

  const service = getSupabaseService();
  const [{ data: profile }, { data: purchase }] = await Promise.all([
    service
      .from("sticke_profiles")
      .select("lifetime_access")
      .eq("id", data.user.id)
      .maybeSingle(),
    email === STICKE_ADMIN_EMAIL
      ? Promise.resolve({ data: null })
      : service
          .from("sticke_purchases")
          .select("id")
          .eq("email", data.user.email ?? email)
          .eq("status", "approved")
          .maybeSingle(),
  ]);

  const destination =
    email === STICKE_ADMIN_EMAIL || profile?.lifetime_access || purchase ? "/galeria" : "/checkout";

  if (debug) {
    debugLog("login:destination", {
      userId: data.user.id,
      email: data.user.email ?? email,
      lifetimeAccess: Boolean(profile?.lifetime_access),
      hasApprovedPurchase: Boolean(purchase),
      destination,
    });
  }

  const response = NextResponse.json({
    ok: true,
    destination,
    debug: debug
      ? {
          userId: data.user.id,
          email: data.user.email ?? email,
          lifetimeAccess: Boolean(profile?.lifetime_access),
          hasApprovedPurchase: Boolean(purchase),
          destination,
        }
      : undefined,
  });

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}
