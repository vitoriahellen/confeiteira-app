// Envio de mensagens via Superchat (https://developers.superchat.com)
// Requer as variáveis de ambiente:
//   SUPERCHAT_API_KEY
//   SUPERCHAT_CHANNEL_ID (opcional — se ausente, o canal de WhatsApp é
//     descoberto automaticamente via GET /channels)

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

  const canal = (data.data || data.items || []).find((c) => c.type === "whats_app");
  if (!canal) {
    console.error("Nenhum canal de WhatsApp encontrado na conta Superchat.");
    return null;
  }

  canalWhatsAppCache = canal.id;
  return canal.id;
}

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

  try {
    const res = await fetch(`${API_BASE}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
        "X-Superchat-Platform": "doce-gestao",
      },
      body: JSON.stringify({
        to: [{ identifier: numeroLimpo }],
        from: { channel_id: channelId, name: "Doce Gestão" },
        content: { type: "text", body: mensagem },
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("Erro ao enviar WhatsApp via Superchat:", numeroLimpo, data);
      return { ok: false, data };
    }

    // Fora da janela de 24h do WhatsApp, a Superchat pode aceitar (200 OK) e
    // depois falhar a entrega — loga o status pra facilitar diagnóstico.
    console.log("Superchat respondeu para", numeroLimpo, ":", JSON.stringify(data));

    return { ok: true, data };
  } catch (err) {
    console.error("Falha na chamada à Superchat:", err);
    return { ok: false, error: String(err) };
  }
}
