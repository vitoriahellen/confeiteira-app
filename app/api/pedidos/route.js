import { NextResponse } from "next/server";
import { query, ensureSchema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  await ensureSchema();

  const { searchParams } = new URL(request.url);
  const de = searchParams.get("de");
  const ate = searchParams.get("ate");
  const status = searchParams.get("status");

  const condicoes = [];
  const valores = [];

  if (de) {
    valores.push(de);
    condicoes.push(`p.data_entrega >= $${valores.length}`);
  }
  if (ate) {
    valores.push(ate);
    condicoes.push(`p.data_entrega <= $${valores.length}`);
  }
  if (status) {
    valores.push(status);
    condicoes.push(`p.status = $${valores.length}`);
  }

  const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";

  const result = await query(
    `SELECT p.*, COALESCE(array_agg(l.tipo) FILTER (WHERE l.tipo IS NOT NULL), '{}') AS lembretes_enviados
     FROM pedidos p
     LEFT JOIN lembretes_enviados l ON l.pedido_id = p.id
     ${where}
     GROUP BY p.id
     ORDER BY p.data_entrega ASC, p.id ASC`,
    valores
  );

  return NextResponse.json({ pedidos: result.rows });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  await ensureSchema();

  const body = await request.json();
  const {
    cliente_nome,
    cliente_telefone,
    itens,
    valor_total,
    valor_sinal,
    data_entrega,
    data_vencimento_sinal,
    data_vencimento_restante,
    status,
    observacoes,
  } = body;

  if (!cliente_nome || !itens || !data_entrega) {
    return NextResponse.json(
      { error: "Preencha ao menos cliente, itens e data de entrega." },
      { status: 400 }
    );
  }

  const result = await query(
    `INSERT INTO pedidos
      (cliente_nome, cliente_telefone, itens, valor_total, valor_sinal,
       data_entrega, data_vencimento_sinal, data_vencimento_restante,
       status, observacoes, criado_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      cliente_nome,
      cliente_telefone || null,
      itens,
      valor_total || 0,
      valor_sinal || 0,
      data_entrega,
      data_vencimento_sinal || null,
      data_vencimento_restante || null,
      status || "novo",
      observacoes || null,
      user.id,
    ]
  );

  return NextResponse.json({ pedido: result.rows[0] });
}
