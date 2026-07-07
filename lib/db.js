import { Pool } from "pg";

let pool;

export function getPool() {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL;

    if (!connectionString) {
      throw new Error(
        "Nenhuma variável de conexão com o banco encontrada (DATABASE_URL / POSTGRES_URL)."
      );
    }

    pool = new Pool({
      connectionString,
      ssl: connectionString.includes("localhost")
        ? false
        : { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function query(text, params) {
  const pool = getPool();
  return pool.query(text, params);
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  papel TEXT NOT NULL DEFAULT 'membro', -- 'admin' ou 'membro'
  telefone TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT,
  itens TEXT NOT NULL,
  valor_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_sinal NUMERIC(10,2) NOT NULL DEFAULT 0,
  sinal_pago BOOLEAN NOT NULL DEFAULT false,
  restante_pago BOOLEAN NOT NULL DEFAULT false,
  data_entrega DATE NOT NULL,
  data_vencimento_sinal DATE,
  data_vencimento_restante DATE,
  status TEXT NOT NULL DEFAULT 'novo', -- novo, em_producao, pronto, entregue, cancelado
  observacoes TEXT,
  criado_por INTEGER REFERENCES usuarios(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lembretes_enviados (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'sinal', 'restante', 'entrega'
  enviado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pedido_id, tipo)
);

CREATE TABLE IF NOT EXISTS configuracoes (
  chave TEXT PRIMARY KEY,
  valor TEXT
);
`;

export async function ensureSchema() {
  const pool = getPool();
  await pool.query(SCHEMA_SQL);
}

export async function hasAnyUser() {
  const pool = getPool();
  await ensureSchema();
  const res = await pool.query("SELECT COUNT(*)::int AS count FROM usuarios");
  return res.rows[0].count > 0;
}
