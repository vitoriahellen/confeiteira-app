import { NextResponse } from "next/server";
import { query, ensureSchema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

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
    condicoes.push(`nome ILIKE $${valores.length}`);
  }
  const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";

  const result = await query(
    `SELECT * FROM produtos ${where} ORDER BY nome ASC`,
    valores
  );

  return NextResponse.json({ produtos: result.rows });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  await ensureSchema();

  const { nome, unidade, descricao, preco_padrao } = await request.json();

  if (!nome) {
    return NextResponse.json({ error: "Preencha o nome do produto." }, { status: 400 });
  }

  const result = await query(
    `INSERT INTO produtos (nome, unidade, descricao, preco_padrao) VALUES ($1, $2, $3, $4) RETURNING *`,
    [nome, unidade || "Un", descricao || null, preco_padrao || 0]
  );

  return NextResponse.json({ produto: result.rows[0] });
}
