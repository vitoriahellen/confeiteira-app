// Ponto único de envio de WhatsApp — hoje só a Z-API (lib/zapi.js), com as
// credenciais vindas de lib/mensageriaConfig.js (banco criptografado, com
// fallback pras variáveis de ambiente ZAPI_*).

import { obterConfigMensageria } from "@/lib/mensageriaConfig";
import * as zapi from "@/lib/zapi";

export async function enviarWhatsApp(numero, mensagem) {
  const cfg = await obterConfigMensageria();
  return zapi.enviarWhatsApp(numero, mensagem, cfg);
}

/** A Z-API é uma ponte não-oficial sem janela de 24h, então sempre usa texto livre. */
export async function enviarLembreteWhatsApp({ numero, mensagem }) {
  const cfg = await obterConfigMensageria();
  return zapi.enviarWhatsApp(numero, mensagem, cfg);
}

/** Número que deve receber os alertas internos (entrega). */
export async function numeroInternoConfigurado() {
  const cfg = await obterConfigMensageria();
  return cfg.numeroInterno;
}
