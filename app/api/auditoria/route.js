import { NextResponse } from "next/server";
import { query, ensureSchema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (user.papel !== "admin") {
    return NextResponse.json({ error: "Apenas administradoras podem ver os logs." }, { status: 403 });
  }

  await ensureSchema();
  const result = await query(
    `SELECT id, usuario_nome, tipo, modulo, detalhes, criado_em
     FROM auditoria ORDER BY criado_em DESC LIMIT 200`
  );
  return NextResponse.json({ eventos: result.rows });
}
