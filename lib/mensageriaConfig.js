import { query } from "@/lib/db";
import { criptografar, descriptografar } from "@/lib/criptografia";
import { registrarEvento } from "@/lib/auditoria";

// Só o token é credencial de fato — só esse campo é criptografado.
const CAMPOS_SECRETOS = new Set(["msg_wapi_token"]);

async function lerBruto() {
  const result = await query("SELECT chave, valor FROM configuracoes WHERE chave LIKE 'msg\\_wapi\\_%'");
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
 * Configuração da W-API, com fallback pras variáveis de ambiente legadas
 * (WAPI_INSTANCE_ID/WAPI_TOKEN/WAPI_NUMERO_INTERNO) quando o campo ainda
 * não foi salvo no banco.
 */
export async function obterConfigMensageria() {
  const bruto = await lerBruto();

  return {
    instanceId: valorTexto(bruto, "msg_wapi_instance_id") || process.env.WAPI_INSTANCE_ID || "",
    token: valorTexto(bruto, "msg_wapi_token") || process.env.WAPI_TOKEN || "",
    tokenDefinido: Boolean(bruto.msg_wapi_token) || Boolean(process.env.WAPI_TOKEN),
    numeroInterno: valorTexto(bruto, "msg_wapi_numero_interno") || process.env.WAPI_NUMERO_INTERNO || "",
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
  await escrever("msg_wapi_instance_id", body.instanceId, false);
  await escrever("msg_wapi_token", body.token, true);
  await escrever("msg_wapi_numero_interno", body.numeroInterno, false);

  await registrarEvento({
    usuarioId: usuario?.id,
    usuarioNome: usuario?.nome,
    tipo: "edicao",
    modulo: "mensageria",
    detalhes: "Atualizou configuração de mensageria (W-API).",
  });
}
