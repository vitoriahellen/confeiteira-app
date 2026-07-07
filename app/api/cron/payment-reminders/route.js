import { NextResponse } from "next/server";
import { query, ensureSchema } from "@/lib/db";
import { enviarWhatsApp } from "@/lib/zapi";
import { dentroDoHorarioConfigurado } from "@/lib/horario";

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

  const horaConfigurada = await getConfig("hora_disparo_lembretes", "09:00");
  if (!dentroDoHorarioConfigurado(horaConfigurada)) {
    return NextResponse.json({ ok: true, skipped: "fora do horário configurado" });
  }

  const dias = Number(await getConfig("dias_lembrete_pagamento", 2));

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
    const mensagem =
      `Olá, ${pedido.cliente_nome}! Passando para lembrar do sinal do seu pedido ` +
      `(${pedido.itens}), no valor de R$ ${Number(pedido.valor_sinal).toFixed(2)}, ` +
      `com vencimento em ${new Date(pedido.data_vencimento_sinal).toLocaleDateString("pt-BR")}. ` +
      `Qualquer dúvida, estou à disposição! 🍰`;
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
    const mensagem =
      `Olá, ${pedido.cliente_nome}! Passando para lembrar do pagamento restante do seu pedido ` +
      `(${pedido.itens}), no valor de R$ ${restante.toFixed(2)}, ` +
      `com vencimento em ${new Date(pedido.data_vencimento_restante).toLocaleDateString("pt-BR")}. ` +
      `Qualquer dúvida, estou à disposição! 🍰`;
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
