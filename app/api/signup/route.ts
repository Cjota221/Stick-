import { NextRequest, NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase-service";

type SignupPayload = {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SignupPayload;
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const password = String(body.password || "");

    if (!name || !phone || !email.includes("@")) {
      return NextResponse.json(
        { error: "Preencha nome, telefone e um e-mail válido." },
        { status: 400 },
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "A senha precisa ter pelo menos 8 caracteres." },
        { status: 400 },
      );
    }

    const { data, error } = await getSupabaseService().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone },
    });

    if (error) {
      const duplicate = /already|registered|exists/i.test(error.message);
      return NextResponse.json(
        {
          error: duplicate
            ? "Já existe uma conta com este e-mail. Entre com sua senha."
            : "Não foi possível criar sua conta. Tente novamente.",
        },
        { status: duplicate ? 409 : 400 },
      );
    }

    return NextResponse.json({ created: Boolean(data.user) }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível criar sua conta. Tente novamente." },
      { status: 500 },
    );
  }
}
