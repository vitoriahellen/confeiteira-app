// Ponto único de envio de WhatsApp — hoje só a W-API (lib/wapi.js), com as
// credenciais vindas de lib/mensageriaConfig.js (banco criptografado, com
// fallback pras variáveis de ambiente WAPI_*).

import { obterConfigMensageria } from "@/lib/mensageriaConfig";
import * as wapi from "@/lib/wapi";

export async function enviarWhatsApp(numero, mensagem) {
  const cfg = await obterConfigMensageria();
  return wapi.enviarWhatsApp(numero, mensagem, cfg);
}

/** A W-API é uma ponte não-oficial sem janela de 24h, então sempre usa texto livre. */
export async function enviarLembreteWhatsApp({ numero, mensagem }) {
  const cfg = await obterConfigMensageria();
  return wapi.enviarWhatsApp(numero, mensagem, cfg);
}

/** Número que deve receber os alertas internos (entrega). */
export async function numeroInternoConfigurado() {
  const cfg = await obterConfigMensageria();
  return cfg.numeroInterno;
}
