import { NextResponse } from "next/server";
import { query, ensureSchema } from "@/lib/db";
import { enviarWhatsApp } from "@/lib/superchat";
import { renderTemplate, TEMPLATES_PADRAO } from "@/lib/lembretes";

function autorizado(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

async function getConfig(chave, padrao) {
  const result = await query("SELECT valor FROM configuracoes WHERE chave = $1", [chave]);
  return result.rows[0] ? result.rows[0].valor : padrao;
}

export async function GET(request) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  await ensureSchema();
  const dias = Number(await getConfig("dias_alerta_entrega", 3));
  const modeloEntrega = await getConfig("mensagem_entrega", TEMPLATES_PADRAO.mensagem_entrega);

  const enviados = [];

  const result = await query(
    `SELECT p.* FROM pedidos p
     LEFT JOIN lembretes_enviados l ON l.pedido_id = p.id AND l.tipo = 'entrega'
     WHERE p.data_entrega = CURRENT_DATE + ($1 || ' days')::interval
       AND p.status NOT IN ('entregue', 'cancelado')
       AND l.id IS NULL`,
    [dias]
  );

  for (const pedido of result.rows) {
    // Alerta interno (equipe) — envia para o próprio número configurado como admin, se houver
    const numeroInterno = process.env.SUPERCHAT_NUMERO_INTERNO;
    const mensagemInterna = renderTemplate(modeloEntrega, {
      nomedocliente: pedido.cliente_nome,
      itens: pedido.itens,
      data: new Date(pedido.data_entrega).toLocaleDateString("pt-BR"),
      dias,
    });

    if (numeroInterno) {
      await enviarWhatsApp(numeroInterno, mensagemInterna);
    }

    await query(
      `INSERT INTO lembretes_enviados (pedido_id, tipo) VALUES ($1, 'entrega')
       ON CONFLICT DO NOTHING`,
      [pedido.id]
    );
    enviados.push({ pedido: pedido.id, tipo: "entrega" });
  }

  return NextResponse.json({ ok: true, enviados });
}
