function primeiroNome(nome) {
  return (nome || "").trim().split(" ")[0];
}

function paraDataLocal(valor) {
  const s = String(valor).slice(0, 10);
  const [ano, mes, dia] = s.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

/**
 * Deriva, a partir da lista de pedidos, os lembretes de cobrança/entrega
 * relevantes (pendentes ou já enviados), ordenados por data.
 */
export function listarLembretes(pedidos) {
  const itens = [];

  for (const p of pedidos || []) {
    if (p.status === "cancelado") continue;
    const enviados = p.lembretes_enviados || [];
    const nome = primeiroNome(p.cliente_nome);

    if (!p.sinal_pago && p.data_vencimento_sinal) {
      itens.push({
        pedidoId: p.id,
        tipo: "sinal",
        texto: `Cobrar sinal de ${nome}`,
        data: p.data_vencimento_sinal,
        enviado: enviados.includes("sinal"),
        telefone: p.cliente_telefone,
        cliente: p.cliente_nome,
        pedido: p,
      });
    }

    if (p.sinal_pago && !p.restante_pago && p.data_vencimento_restante) {
      itens.push({
        pedidoId: p.id,
        tipo: "restante",
        texto: `Cobrar restante de ${nome}`,
        data: p.data_vencimento_restante,
        enviado: enviados.includes("restante"),
        telefone: p.cliente_telefone,
        cliente: p.cliente_nome,
        pedido: p,
      });
    }

    if (p.status !== "entregue" && p.data_entrega) {
      itens.push({
        pedidoId: p.id,
        tipo: "entrega",
        texto: `Lembrar entrega de ${nome}`,
        data: p.data_entrega,
        enviado: enviados.includes("entrega"),
        telefone: p.cliente_telefone,
        cliente: p.cliente_nome,
        pedido: p,
      });
    }
  }

  return itens.sort((a, b) => paraDataLocal(a.data) - paraDataLocal(b.data));
}

export function formatarDataRelativa(valor) {
  const alvo = paraDataLocal(valor);
  const hoje = paraDataLocal(new Date().toISOString());
  const diffDias = Math.round((alvo - hoje) / 86400000);

  if (diffDias === 0) return "Hoje";
  if (diffDias === 1) return "Amanhã";
  if (diffDias === -1) return "Ontem";
  if (diffDias < 0) return `Atrasado ${Math.abs(diffDias)}d`;
  if (diffDias <= 6) return `Em ${diffDias} dias`;
  return alvo.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/** Agrupa lembretes por pedido, mantendo apenas o mais próximo de cada um (lista já vem ordenada por data). */
export function porPedido(itens) {
  const mapa = {};
  for (const item of itens) {
    if (!(item.pedidoId in mapa)) mapa[item.pedidoId] = item;
  }
  return mapa;
}

export function linkWhatsApp(telefone, mensagem) {
  if (!telefone) return null;
  const numero = telefone.replace(/\D/g, "");
  if (!numero) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

/** Monta um texto de cobrança/lembrete pronto para envio manual, no mesmo tom das mensagens automáticas. */
export function mensagemPadrao(item) {
  const p = item.pedido;
  if (item.tipo === "sinal") {
    return (
      `Olá, ${p.cliente_nome}! Passando para lembrar do sinal do seu pedido (${p.itens}), ` +
      `no valor de R$ ${Number(p.valor_sinal).toFixed(2)}, com vencimento em ` +
      `${paraDataLocal(p.data_vencimento_sinal).toLocaleDateString("pt-BR")}. Qualquer dúvida, estou à disposição! 🍰`
    );
  }
  if (item.tipo === "restante") {
    const restante = Number(p.valor_total) - Number(p.valor_sinal);
    return (
      `Olá, ${p.cliente_nome}! Passando para lembrar do pagamento restante do seu pedido (${p.itens}), ` +
      `no valor de R$ ${restante.toFixed(2)}, com vencimento em ` +
      `${paraDataLocal(p.data_vencimento_restante).toLocaleDateString("pt-BR")}. Qualquer dúvida, estou à disposição! 🍰`
    );
  }
  return (
    `Olá, ${p.cliente_nome}! Passando para lembrar que a entrega do seu pedido (${p.itens}) ` +
    `está prevista para ${paraDataLocal(p.data_entrega).toLocaleDateString("pt-BR")}. Qualquer dúvida, estou à disposição! 🍰`
  );
}
