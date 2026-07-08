// Ponto único de envio de WhatsApp — escolhe Superchat ou Z-API conforme o
// provedor configurado em Configurações → Parâmetros (lib/mensageriaConfig.js).

import { obterConfigMensageria } from "@/lib/mensageriaConfig";
import * as superchat from "@/lib/superchat";
import * as zapi from "@/lib/zapi";

export async function enviarWhatsApp(numero, mensagem) {
  const cfg = await obterConfigMensageria();
  return cfg.provedor === "zapi"
    ? zapi.enviarWhatsApp(numero, mensagem, cfg.zapi)
    : superchat.enviarWhatsApp(numero, mensagem, cfg.superchat);
}

/**
 * Envia um lembrete (sinal/restante/entrega). A Z-API é uma ponte não-oficial
 * sem janela de 24h, então não precisa de template — usa sempre texto livre.
 */
export async function enviarLembreteWhatsApp({ numero, tipo, variaveis, mensagem }) {
  const cfg = await obterConfigMensageria();
  if (cfg.provedor === "zapi") {
    return zapi.enviarWhatsApp(numero, mensagem, cfg.zapi);
  }
  return superchat.enviarLembreteWhatsApp({ numero, tipo, variaveis, mensagem, config: cfg.superchat });
}

/** Número que deve receber os alertas internos (entrega), do provedor ativo. */
export async function numeroInternoConfigurado() {
  const cfg = await obterConfigMensageria();
  return cfg.provedor === "zapi" ? cfg.zapi.numeroInterno : cfg.superchat.numeroInterno;
}
