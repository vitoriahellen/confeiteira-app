import { NextResponse } from "next/server";
import { query, ensureSchema } from "@/lib/db";
import { enviarWhatsApp } from "@/lib/superchat";
import { renderTemplate, TEMPLATES_PADRAO, formatarMoeda } from "@/lib/lembretes";

function autorizado(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // sem secret configurado, permite (defina CRON_SECRET em produção)
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
  const dias = Number(await getConfig("dias_lembrete_pagamento", 2));
  const modeloSinal = await getConfig("mensagem_sinal", TEMPLATES_PADRAO.mensagem_sinal);
  const modeloRestante = await getConfig("mensagem_restante", TEMPLATES_PADRAO.mensagem_restante);

  const enviados = [];

  // Sinal pendente
  const sinalRes = await query(
    `SELECT p.* FROM pedidos p
     LEFT JOIN lembretes_enviados l ON l.pedido_id = p.id AND l.tipo = 'sinal'
     WHERE p.sinal_pago = false
       AND p.data_vencimento_sinal IS NOT NULL
       AND p.data_vencimento_sinal <= CURRENT_DATE + ($1 || ' days')::interval
       AND p.data_vencimento_sinal >= CURRENT_DATE
       AND p.status NOT IN ('entregue', 'cancelado')
       AND l.id IS NULL`,
    [dias]
  );

  for (const pedido of sinalRes.rows) {
    if (!pedido.cliente_telefone) continue;
    const mensagem = renderTemplate(modeloSinal, {
      nomedocliente: pedido.cliente_nome,
      valor: formatarMoeda(pedido.valor_sinal),
      itens: pedido.itens,
      data: new Date(pedido.data_vencimento_sinal).toLocaleDateString("pt-BR"),
    });
    const resultado = await enviarWhatsApp(pedido.cliente_telefone, mensagem);
    if (resultado.ok) {
      await query(
        `INSERT INTO lembretes_enviados (pedido_id, tipo) VALUES ($1, 'sinal')
         ON CONFLICT DO NOTHING`,
        [pedido.id]
      );
      enviados.push({ pedido: pedido.id, tipo: "sinal" });
    }
  }

  // Restante pendente
  const restanteRes = await query(
    `SELECT p.* FROM pedidos p
     LEFT JOIN lembretes_enviados l ON l.pedido_id = p.id AND l.tipo = 'restante'
     WHERE p.restante_pago = false
       AND p.data_vencimento_restante IS NOT NULL
       AND p.data_vencimento_restante <= CURRENT_DATE + ($1 || ' days')::interval
       AND p.data_vencimento_restante >= CURRENT_DATE
       AND p.status NOT IN ('entregue', 'cancelado')
       AND l.id IS NULL`,
    [dias]
  );

  for (const pedido of restanteRes.rows) {
    if (!pedido.cliente_telefone) continue;
    const restante = Number(pedido.valor_total) - Number(pedido.valor_sinal);
    const mensagem = renderTemplate(modeloRestante, {
      nomedocliente: pedido.cliente_nome,
      valor: formatarMoeda(restante),
      itens: pedido.itens,
      data: new Date(pedido.data_vencimento_restante).toLocaleDateString("pt-BR"),
    });
    const resultado = await enviarWhatsApp(pedido.cliente_telefone, mensagem);
    if (resultado.ok) {
      await query(
        `INSERT INTO lembretes_enviados (pedido_id, tipo) VALUES ($1, 'restante')
         ON CONFLICT DO NOTHING`,
        [pedido.id]
      );
      enviados.push({ pedido: pedido.id, tipo: "restante" });
    }
  }

  return NextResponse.json({ ok: true, enviados });
}
