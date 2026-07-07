import { NextResponse } from "next/server";
import { query, ensureSchema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { TEMPLATES_PADRAO } from "@/lib/lembretes";

const DEFAULTS = {
  dias_lembrete_pagamento: "2",
  dias_alerta_entrega: "3",
  ...TEMPLATES_PADRAO,
};

const CHAVES_PERMITIDAS = [...Object.keys(DEFAULTS), "logo_url"];

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  await ensureSchema();
  const result = await query("SELECT chave, valor FROM configuracoes");
  const config = { ...DEFAULTS };
  for (const row of result.rows) config[row.chave] = row.valor;

  return NextResponse.json({
    config,
    zapiConfigurada: Boolean(process.env.ZAPI_INSTANCE_ID && process.env.ZAPI_TOKEN),
  });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (user.papel !== "admin") {
    return NextResponse.json({ error: "Apenas administradores podem alterar configurações." }, { status: 403 });
  }

  const body = await request.json();

  for (const chave of CHAVES_PERMITIDAS) {
    if (chave in body) {
      await query(
        `INSERT INTO configuracoes (chave, valor) VALUES ($1, $2)
         ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor`,
        [chave, String(body[chave])]
      );
    }
  }

  return NextResponse.json({ ok: true });
}
