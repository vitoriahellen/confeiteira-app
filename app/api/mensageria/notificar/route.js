import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { enviarLembreteWhatsApp } from "@/lib/superchat";
import { mensagemPadrao, variaveisLembrete, TEMPLATES_PADRAO } from "@/lib/lembretes";

const TIPOS_VALIDOS = ["sinal", "restante", "entrega"];

async function getConfig(chave, padrao) {
  const result = await query("SELECT valor FROM configuracoes WHERE chave = $1", [chave]);
  return result.rows[0] ? result.rows[0].valor : padrao;
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { pedidoId, tipo } = await request.json();
  if (!pedidoId || !TIPOS_VALIDOS.includes(tipo)) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const result = await query("SELECT * FROM pedidos WHERE id = $1", [pedidoId]);
  const pedido = result.rows[0];
  if (!pedido) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  const templates = {
    mensagem_sinal: await getConfig("mensagem_sinal", TEMPLATES_PADRAO.mensagem_sinal),
    mensagem_restante: await getConfig("mensagem_restante", TEMPLATES_PADRAO.mensagem_restante),
    mensagem_entrega: await getConfig("mensagem_entrega", TEMPLATES_PADRAO.mensagem_entrega),
  };

  const mensagem = mensagemPadrao({ tipo, pedido }, templates);

  // Cobrança de sinal/restante vai pro WhatsApp da cliente; alerta de entrega é interno (equipe)
  const destino = tipo === "entrega" ? process.env.SUPERCHAT_NUMERO_INTERNO : pedido.cliente_telefone;
  if (!destino) {
    return NextResponse.json(
      {
        error:
          tipo === "entrega"
            ? "Defina a variável SUPERCHAT_NUMERO_INTERNO no projeto para receber alertas de entrega."
            : "Esta cliente não tem WhatsApp cadastrado.",
      },
      { status: 400 }
    );
  }

  const resultado = await enviarLembreteWhatsApp({
    numero: destino,
    tipo,
    variaveis: variaveisLembrete({ tipo, pedido }),
    mensagem,
  });
  if (!resultado.ok) {
    return NextResponse.json(
      { error: resultado.skipped ? "Superchat não configurada no projeto." : "Não foi possível enviar a mensagem agora." },
      { status: 502 }
    );
  }

  await query(
    `INSERT INTO lembretes_enviados (pedido_id, tipo) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [pedidoId, tipo]
  );

  return NextResponse.json({ ok: true });
}
