import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  await query("UPDATE usuarios SET tutorial_visto = true WHERE id = $1", [user.id]);
  return NextResponse.json({ ok: true });
}
