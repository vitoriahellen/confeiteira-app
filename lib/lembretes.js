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

export function formatarMoeda(valor) {
  return Number(valor || 0).toFixed(2).replace(".", ",");
}

export function linkWhatsApp(telefone, mensagem) {
  if (!telefone) return null;
  const numero = telefone.replace(/\D/g, "");
  if (!numero) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

/** Modelos padrão das mensagens automáticas — usados quando não há personalização salva em Configurações. */
export const TEMPLATES_PADRAO = {
  mensagem_sinal:
    "Olá, {{nomedocliente}}! Passando para lembrar do sinal do seu pedido ({{itens}}), no valor de R$ {{valor}}, com vencimento em {{data}}. Qualquer dúvida, estou à disposição! 🍰",
  mensagem_restante:
    "Olá, {{nomedocliente}}! Passando para lembrar do pagamento restante do seu pedido ({{itens}}), no valor de R$ {{valor}}, com vencimento em {{data}}. Qualquer dúvida, estou à disposição! 🍰",
  mensagem_entrega:
    "⏰ Faltam {{dias}} dias para a entrega do pedido de {{nomedocliente}} ({{itens}}), previsto para {{data}}.",
};

/** Substitui {{chave}} pelos valores informados (case-insensitive). Chave sem valor vira string vazia. */
export function renderTemplate(template, variaveis) {
  return String(template ?? "").replace(/\{\{\s*(\w+)\s*\}\}/g, (match, chave) => {
    const valor = variaveis?.[chave.toLowerCase()];
    return valor !== undefined && valor !== null ? String(valor) : "";
  });
}

/**
 * Variáveis "cruas" de um lembrete (sem renderizar em texto) — usadas tanto
 * para montar a mensagem de texto livre quanto as variáveis posicionais de
 * um Template aprovado do WhatsApp.
 */
export function variaveisLembrete(item) {
  const p = item.pedido;

  if (item.tipo === "sinal") {
    return {
      nomedocliente: p.cliente_nome,
      valor: formatarMoeda(p.valor_sinal),
      itens: p.itens,
      data: paraDataLocal(p.data_vencimento_sinal).toLocaleDateString("pt-BR"),
    };
  }

  if (item.tipo === "restante") {
    const restante = Number(p.valor_total) - Number(p.valor_sinal);
    return {
      nomedocliente: p.cliente_nome,
      valor: formatarMoeda(restante),
      itens: p.itens,
      data: paraDataLocal(p.data_vencimento_restante).toLocaleDateString("pt-BR"),
    };
  }

  const hoje = paraDataLocal(new Date().toISOString());
  const dias = Math.max(0, Math.round((paraDataLocal(p.data_entrega) - hoje) / 86400000));
  return {
    nomedocliente: p.cliente_nome,
    itens: p.itens,
    data: paraDataLocal(p.data_entrega).toLocaleDateString("pt-BR"),
    dias,
  };
}

/**
 * Monta um texto de cobrança/lembrete pronto para envio, usando os modelos
 * personalizados (de Configurações) quando informados, ou os padrões.
 */
export function mensagemPadrao(item, templates) {
  const modelos = { ...TEMPLATES_PADRAO, ...(templates || {}) };
  return renderTemplate(modelos[`mensagem_${item.tipo}`], variaveisLembrete(item));
}
