// Envio de mensagens via Superchat (https://developers.superchat.com)
// Requer as variáveis de ambiente:
//   SUPERCHAT_API_KEY
//   SUPERCHAT_CHANNEL_ID (opcional — se ausente, o canal de WhatsApp é
//     descoberto automaticamente via GET /channels)
//
// Fora da janela de 24h de conversa do WhatsApp, mensagens de texto livre são
// recusadas pela Meta ("Iniciar conversa não permitido") — é preciso usar um
// Modelo de Mensagem (Template) aprovado. Os nomes esperados dos templates
// (configuráveis via SUPERCHAT_TEMPLATE_SINAL/RESTANTE/ENTREGA) são
// descobertos automaticamente via GET /templates; se não existirem ainda
// (aguardando aprovação da Meta), o envio cai para texto livre.

const API_BASE = "https://api.superchat.com/v1.0";

/**
 * A Superchat exige o número em E.164 com "+" (ex: +5519999999999).
 * Cadastros costumam ter só DDD + número (10 ou 11 dígitos) — nesse caso,
 * prefixa o 55 (Brasil) automaticamente antes de enviar.
 */
function normalizarNumero(numero) {
  const digitos = String(numero || "").replace(/\D/g, "");
  const comDDI =
    (digitos.length === 10 || digitos.length === 11) && !digitos.startsWith("55")
      ? `55${digitos}`
      : digitos;
  return `+${comDDI}`;
}

let canalWhatsAppCache = null;

async function obterCanalWhatsApp(apiKey) {
  if (process.env.SUPERCHAT_CHANNEL_ID) return process.env.SUPERCHAT_CHANNEL_ID;
  if (canalWhatsAppCache) return canalWhatsAppCache;

  const res = await fetch(`${API_BASE}/channels?limit=100`, {
    headers: { "X-API-KEY": apiKey },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Erro ao buscar canais na Superchat:", data);
    return null;
  }

  const canal = (data.results || []).find((c) => c.type === "whats_app");
  if (!canal) {
    console.error("Nenhum canal de WhatsApp encontrado na conta Superchat:", JSON.stringify(data));
    return null;
  }

  canalWhatsAppCache = canal.id;
  return canal.id;
}

// Nome dos Modelos de Mensagem (Templates) aprovados no painel da Superchat,
// por tipo de lembrete. Pode ser sobrescrito por variável de ambiente caso os
// nomes cadastrados sejam diferentes.
const NOMES_TEMPLATE = {
  sinal: process.env.SUPERCHAT_TEMPLATE_SINAL || "doce_gestao_sinal",
  restante: process.env.SUPERCHAT_TEMPLATE_RESTANTE || "doce_gestao_restante",
  entrega: process.env.SUPERCHAT_TEMPLATE_ENTREGA || "doce_gestao_entrega",
};

// Ordem posicional das variáveis dentro do texto aprovado de cada template
// (precisa bater com a ordem de {{1}}, {{2}}... usada ao criar o template).
const VARIAVEIS_TEMPLATE = {
  sinal: ["nomedocliente", "itens", "valor", "data"],
  restante: ["nomedocliente", "itens", "valor", "data"],
  entrega: ["dias", "nomedocliente", "itens", "data"],
};

let templatesCache = null;

async function obterTemplates(apiKey) {
  if (templatesCache) return templatesCache;

  const res = await fetch(`${API_BASE}/templates?type=whats_app_template&limit=100`, {
    headers: { "X-API-KEY": apiKey },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Erro ao buscar templates na Superchat:", data);
    return {};
  }

  const mapa = {};
  for (const t of data.results || []) mapa[t.name] = t.id;
  templatesCache = mapa;
  return mapa;
}

async function enviarCorpo(apiKey, body, numeroLimpo) {
  try {
    const res = await fetch(`${API_BASE}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
        "X-Superchat-Platform": "doce-gestao",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("Erro ao enviar WhatsApp via Superchat:", numeroLimpo, data);
      return { ok: false, data };
    }

    console.log("Superchat respondeu para", numeroLimpo, ":", JSON.stringify(data));
    return { ok: true, data };
  } catch (err) {
    console.error("Falha na chamada à Superchat:", err);
    return { ok: false, error: String(err) };
  }
}

/** Envia texto livre. Falha fora da janela de 24h se a cliente não escreveu recentemente. */
export async function enviarWhatsApp(numero, mensagem) {
  const apiKey = process.env.SUPERCHAT_API_KEY;

  if (!apiKey) {
    console.warn("Superchat não configurada (SUPERCHAT_API_KEY ausente). Mensagem não enviada.");
    return { ok: false, skipped: true };
  }

  const channelId = await obterCanalWhatsApp(apiKey);
  if (!channelId) {
    return { ok: false, error: "Canal de WhatsApp da Superchat não encontrado." };
  }

  const numeroLimpo = normalizarNumero(numero);
  return enviarCorpo(
    apiKey,
    {
      to: [{ identifier: numeroLimpo }],
      from: { channel_id: channelId, name: "Doce Gestão" },
      content: { type: "text", body: mensagem },
    },
    numeroLimpo
  );
}

/**
 * Envia um lembrete (sinal/restante/entrega). Usa o Template aprovado da
 * Meta correspondente quando disponível (funciona fora da janela de 24h);
 * caso o template ainda não exista/esteja aprovado, cai para texto livre.
 */
export async function enviarLembreteWhatsApp({ numero, tipo, variaveis, mensagem }) {
  const apiKey = process.env.SUPERCHAT_API_KEY;

  if (!apiKey) {
    console.warn("Superchat não configurada (SUPERCHAT_API_KEY ausente). Mensagem não enviada.");
    return { ok: false, skipped: true };
  }

  const channelId = await obterCanalWhatsApp(apiKey);
  if (!channelId) {
    return { ok: false, error: "Canal de WhatsApp da Superchat não encontrado." };
  }

  const numeroLimpo = normalizarNumero(numero);
  const templates = await obterTemplates(apiKey);
  const templateId = templates[NOMES_TEMPLATE[tipo]];

  if (templateId) {
    const ordem = VARIAVEIS_TEMPLATE[tipo] || [];
    const resultado = await enviarCorpo(
      apiKey,
      {
        to: [{ identifier: numeroLimpo }],
        from: { channel_id: channelId, name: "Doce Gestão" },
        content: {
          type: "whats_app_template",
          template_id: templateId,
          variables: ordem.map((chave, posicao) => ({
            position: posicao,
            value: String(variaveis?.[chave] ?? ""),
          })),
        },
      },
      numeroLimpo
    );
    if (resultado.ok) return resultado;
  }

  // Sem template disponível (ou falhou o envio por template) — tenta texto livre,
  // que funciona se a cliente tiver escrito nas últimas 24h.
  return enviarCorpo(
    apiKey,
    {
      to: [{ identifier: numeroLimpo }],
      from: { channel_id: channelId, name: "Doce Gestão" },
      content: { type: "text", body: mensagem },
    },
    numeroLimpo
  );
}
