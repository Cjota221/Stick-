import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "O acesso por código foi substituído por login e senha." },
    { status: 410 },
  );
}
