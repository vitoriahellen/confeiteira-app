import { query } from "@/lib/db";

/**
 * Registra um evento na trilha de auditoria (aba Logs em Configurações).
 * Nunca lança erro — uma falha ao gravar o log não pode derrubar a
 * requisição principal que a originou.
 */
export async function registrarEvento({ usuarioId, usuarioNome, tipo, modulo, detalhes }) {
  try {
    await query(
      `INSERT INTO auditoria (usuario_id, usuario_nome, tipo, modulo, detalhes)
       VALUES ($1, $2, $3, $4, $5)`,
      [usuarioId ?? null, usuarioNome ?? null, tipo, modulo ?? null, detalhes ?? null]
    );
  } catch (err) {
    console.error("Falha ao registrar evento de auditoria:", err);
  }
}
