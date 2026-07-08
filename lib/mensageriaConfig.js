import { query } from "@/lib/db";
import { criptografar, descriptografar } from "@/lib/criptografia";
import { registrarEvento } from "@/lib/auditoria";

// Campos que guardam credencial de fato (token/senha de API) — só esses são
// criptografados. IDs, números de telefone e nomes de template não são
// segredo por si só e ficam em texto puro, como o resto de `configuracoes`.
const CAMPOS_SECRETOS = new Set(["msg_superchat_api_key", "msg_zapi_token", "msg_zapi_client_token"]);

async function lerBruto() {
  const result = await query("SELECT chave, valor FROM configuracoes WHERE chave LIKE 'msg\\_%'");
  const bruto = {};
  for (const row of result.rows) bruto[row.chave] = row.valor;
  return bruto;
}

function valorTexto(bruto, chave) {
  const valor = bruto[chave];
  if (!valor) return "";
  return CAMPOS_SECRETOS.has(chave) ? descriptografar(valor) || "" : valor;
}

/**
 * Configuração ativa de mensageria (WhatsApp), com fallback pras variáveis de
 * ambiente da Vercel quando o campo ainda não foi salvo no banco — assim,
 * quem já tinha configurado via Vercel não perde a integração.
 */
export async function obterConfigMensageria() {
  const bruto = await lerBruto();

  return {
    provedor: bruto.msg_provedor || "superchat",
    superchat: {
      apiKey: valorTexto(bruto, "msg_superchat_api_key") || process.env.SUPERCHAT_API_KEY || "",
      apiKeyDefinida: Boolean(bruto.msg_superchat_api_key) || Boolean(process.env.SUPERCHAT_API_KEY),
      channelId: valorTexto(bruto, "msg_superchat_channel_id") || process.env.SUPERCHAT_CHANNEL_ID || "",
      numeroInterno: valorTexto(bruto, "msg_superchat_numero_interno") || process.env.SUPERCHAT_NUMERO_INTERNO || "",
      templateSinal: valorTexto(bruto, "msg_superchat_template_sinal") || process.env.SUPERCHAT_TEMPLATE_SINAL || "",
      templateRestante: valorTexto(bruto, "msg_superchat_template_restante") || process.env.SUPERCHAT_TEMPLATE_RESTANTE || "",
      templateEntrega: valorTexto(bruto, "msg_superchat_template_entrega") || process.env.SUPERCHAT_TEMPLATE_ENTREGA || "",
    },
    zapi: {
      instanceId: valorTexto(bruto, "msg_zapi_instance_id") || process.env.ZAPI_INSTANCE_ID || "",
      token: valorTexto(bruto, "msg_zapi_token") || process.env.ZAPI_TOKEN || "",
      tokenDefinido: Boolean(bruto.msg_zapi_token) || Boolean(process.env.ZAPI_TOKEN),
      clientToken: valorTexto(bruto, "msg_zapi_client_token") || process.env.ZAPI_CLIENT_TOKEN || "",
      clientTokenDefinido: Boolean(bruto.msg_zapi_client_token) || Boolean(process.env.ZAPI_CLIENT_TOKEN),
      numeroInterno: valorTexto(bruto, "msg_zapi_numero_interno") || process.env.ZAPI_NUMERO_INTERNO || "",
    },
  };
}

async function escrever(chave, valorNovo, secreto) {
  if (valorNovo === undefined) return;
  // Campo secreto em branco = "não mexer" (o valor real nunca volta pro navegador
  // pra poder ser reenviado, então um campo vazio não pode significar "apagar").
  if (secreto && !valorNovo) return;
  const valorFinal = secreto ? criptografar(valorNovo) : valorNovo || null;
  await query(
    `INSERT INTO configuracoes (chave, valor) VALUES ($1, $2)
     ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor`,
    [chave, valorFinal]
  );
}

export async function salvarConfigMensageria(body, usuario) {
  if (body.provedor) await escrever("msg_provedor", body.provedor, false);

  if (body.superchat) {
    const s = body.superchat;
    await escrever("msg_superchat_api_key", s.apiKey, true);
    await escrever("msg_superchat_channel_id", s.channelId, false);
    await escrever("msg_superchat_numero_interno", s.numeroInterno, false);
    await escrever("msg_superchat_template_sinal", s.templateSinal, false);
    await escrever("msg_superchat_template_restante", s.templateRestante, false);
    await escrever("msg_superchat_template_entrega", s.templateEntrega, false);
  }

  if (body.zapi) {
    const z = body.zapi;
    await escrever("msg_zapi_instance_id", z.instanceId, false);
    await escrever("msg_zapi_token", z.token, true);
    await escrever("msg_zapi_client_token", z.clientToken, true);
    await escrever("msg_zapi_numero_interno", z.numeroInterno, false);
  }

  await registrarEvento({
    usuarioId: usuario?.id,
    usuarioNome: usuario?.nome,
    tipo: "edicao",
    modulo: "mensageria",
    detalhes: `Atualizou configuração de mensageria (provedor: ${body.provedor || "sem alteração"}).`,
  });
}
