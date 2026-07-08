import { NextResponse } from "next/server";
import { query, ensureSchema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { registrarEvento } from "@/lib/auditoria";

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  await ensureSchema();

  const { searchParams } = new URL(request.url);
  const busca = searchParams.get("busca");

  const condicoes = [];
  const valores = [];
  if (busca) {
    valores.push(`%${busca}%`);
    condicoes.push(`(nome ILIKE $${valores.length} OR telefone ILIKE $${valores.length})`);
  }
  const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";

  const result = await query(
    `SELECT * FROM clientes ${where} ORDER BY nome ASC`,
    valores
  );

  return NextResponse.json({ clientes: result.rows });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  await ensureSchema();

  const { nome, telefone, endereco } = await request.json();

  if (!nome) {
    return NextResponse.json({ error: "Preencha o nome da cliente." }, { status: 400 });
  }

  const result = await query(
    `INSERT INTO clientes (nome, telefone, endereco) VALUES ($1, $2, $3) RETURNING *`,
    [nome, telefone || null, endereco || null]
  );

  await registrarEvento({
    usuarioId: user.id,
    usuarioNome: user.nome,
    tipo: "criacao",
    modulo: "clientes",
    detalhes: `Criou cliente ${nome}.`,
  });

  return NextResponse.json({ cliente: result.rows[0] });
}
