// Envio de mensagens via W-API (https://docs.w-api.app) — instância/token
// vêm de `config` (resolvido por lib/mensageriaConfig.js: banco
// criptografado, com fallback pras variáveis de ambiente WAPI_INSTANCE_ID/
// WAPI_TOKEN).

const API_BASE = "https://api.w-api.app/v1";

/**
 * A W-API exige o número completo com código do país (55), só dígitos.
 * Cadastros costumam ter só DDD + número (10 ou 11 dígitos) — nesse caso,
 * prefixa o 55 automaticamente em vez de deixar a mensagem "sumir" sem erro.
 */
function normalizarNumero(numero) {
  const digitos = String(numero || "").replace(/\D/g, "");
  if ((digitos.length === 10 || digitos.length === 11) && !digitos.startsWith("55")) {
    return `55${digitos}`;
  }
  return digitos;
}

export async function enviarWhatsApp(numero, mensagem, config) {
  const instanceId = config?.instanceId;
  const token = config?.token;

  if (!instanceId || !token) {
    console.warn("W-API não configurada (instância/token ausentes). Mensagem não enviada.");
    return { ok: false, skipped: true };
  }

  const numeroLimpo = normalizarNumero(numero);
  const url = `${API_BASE}/message/send-text?instanceId=${instanceId}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ phone: numeroLimpo, message: mensagem }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Erro ao enviar WhatsApp via W-API:", numeroLimpo, data);
      return { ok: false, data };
    }
    console.log("W-API respondeu para", numeroLimpo, ":", JSON.stringify(data));
    return { ok: true, data };
  } catch (err) {
    console.error("Falha na chamada à W-API:", err);
    return { ok: false, error: String(err) };
  }
}
