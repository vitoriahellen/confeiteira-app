import crypto from "crypto";

// Criptografa credenciais de integrações (tokens de API) antes de salvar no
// banco. A chave é derivada do AUTH_SECRET (já usado para assinar sessões) —
// isso evita exigir mais uma variável de ambiente, mas significa que a chave
// de criptografia continua vivendo fora do banco (na Vercel), como tem que
// ser: quem só vazar o banco não consegue ler os tokens sem o AUTH_SECRET.
function obterChave() {
  const segredo = process.env.AUTH_SECRET || "dev-secret-troque-em-producao";
  return crypto.scryptSync(segredo, "doce-gestao-mensageria", 32);
}

export function criptografar(texto) {
  if (!texto) return null;
  const iv = crypto.randomBytes(12);
  const cifra = crypto.createCipheriv("aes-256-gcm", obterChave(), iv);
  const cifrado = Buffer.concat([cifra.update(String(texto), "utf8"), cifra.final()]);
  const tag = cifra.getAuthTag();
  return Buffer.concat([iv, tag, cifrado]).toString("base64");
}

export function descriptografar(valor) {
  if (!valor) return null;
  try {
    const dados = Buffer.from(valor, "base64");
    const iv = dados.subarray(0, 12);
    const tag = dados.subarray(12, 28);
    const cifrado = dados.subarray(28);
    const decifra = crypto.createDecipheriv("aes-256-gcm", obterChave(), iv);
    decifra.setAuthTag(tag);
    return Buffer.concat([decifra.update(cifrado), decifra.final()]).toString("utf8");
  } catch (err) {
    console.error("Falha ao descriptografar credencial:", err);
    return null;
  }
}
