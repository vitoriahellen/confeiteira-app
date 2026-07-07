// Envio de mensagens via Z-API (https://www.z-api.io)
// Requer as variáveis de ambiente:
//   ZAPI_INSTANCE_ID
//   ZAPI_TOKEN
//   ZAPI_CLIENT_TOKEN (Client-Token, disponível no painel de segurança da Z-API)

export async function enviarWhatsApp(numero, mensagem) {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;

  if (!instanceId || !token) {
    console.warn(
      "Z-API não configurada (ZAPI_INSTANCE_ID / ZAPI_TOKEN ausentes). Mensagem não enviada."
    );
    return { ok: false, skipped: true };
  }

  const numeroLimpo = numero.replace(/\D/g, "");

  const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(clientToken ? { "Client-Token": clientToken } : {}),
      },
      body: JSON.stringify({
        phone: numeroLimpo,
        message: mensagem,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("Erro ao enviar WhatsApp via Z-API:", data);
      return { ok: false, data };
    }

    return { ok: true, data };
  } catch (err) {
    console.error("Falha na chamada à Z-API:", err);
    return { ok: false, error: String(err) };
  }
}
