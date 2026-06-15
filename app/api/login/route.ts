import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { debugLog, isDebugEnabled } from "@/lib/sticke-debug";
import { getStickeAccessState } from "@/lib/sticke-access";

type LoginPayload = {
  email?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
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

  const access = await getStickeAccessState({
    id: data.user.id,
    email: data.user.email ?? email,
  });

  const destination = access.hasAccess ? "/galeria" : "/";

  if (debug) {
    debugLog("login:destination", {
      userId: data.user.id,
      email: data.user.email ?? email,
      lifetimeAccess: access.lifetimeAccess,
      hasApprovedPurchase: access.hasApprovedPurchase,
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
          lifetimeAccess: access.lifetimeAccess,
          hasApprovedPurchase: access.hasApprovedPurchase,
          destination,
        }
      : undefined,
  });

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}
