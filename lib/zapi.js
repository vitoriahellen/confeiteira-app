// Envio de mensagens via Z-API (https://www.z-api.io) — instância/token vêm
// de `config` (resolvido por lib/mensageriaConfig.js: banco criptografado,
// com fallback pras variáveis de ambiente ZAPI_INSTANCE_ID/ZAPI_TOKEN/
// ZAPI_CLIENT_TOKEN).

/**
 * A Z-API exige o número completo com código do país (55). Cadastros
 * costumam ter só DDD + número (10 ou 11 dígitos) — nesse caso, prefixa
 * o 55 automaticamente em vez de deixar a mensagem "sumir" sem erro.
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
  const clientToken = config?.clientToken;

  if (!instanceId || !token) {
    console.warn("Z-API não configurada (instância/token ausentes). Mensagem não enviada.");
    return { ok: false, skipped: true };
  }

  const numeroLimpo = normalizarNumero(numero);
  const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(clientToken ? { "Client-Token": clientToken } : {}),
      },
      body: JSON.stringify({ phone: numeroLimpo, message: mensagem }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Erro ao enviar WhatsApp via Z-API:", numeroLimpo, data);
      return { ok: false, data };
    }
    console.log("Z-API respondeu para", numeroLimpo, ":", JSON.stringify(data));
    return { ok: true, data };
  } catch (err) {
    console.error("Falha na chamada à Z-API:", err);
    return { ok: false, error: String(err) };
  }
}
