import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { registrarEvento } from "@/lib/auditoria";

export async function GET(_request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const result = await query("SELECT * FROM produtos WHERE id = $1", [id]);
  if (!result.rows.length) {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  }
  return NextResponse.json({ produto: result.rows[0] });
}

export async function PUT(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const campos = ["nome", "unidade", "descricao", "preco_padrao"];
  const sets = [];
  const valores = [];

  for (const campo of campos) {
    if (campo in body) {
      valores.push(body[campo]);
      sets.push(`${campo} = $${valores.length}`);
    }
  }

  if (!sets.length) {
    return NextResponse.json({ error: "Nenhum campo para atualizar." }, { status: 400 });
  }

  sets.push(`atualizado_em = now()`);
  valores.push(id);

  const result = await query(
    `UPDATE produtos SET ${sets.join(", ")} WHERE id = $${valores.length} RETURNING *`,
    valores
  );

  if (!result.rows.length) {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  }

  await registrarEvento({
    usuarioId: user.id,
    usuarioNome: user.nome,
    tipo: "edicao",
    modulo: "produtos",
    detalhes: `Editou produto #${id}.`,
  });

  return NextResponse.json({ produto: result.rows[0] });
}

export async function DELETE(_request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  await query("DELETE FROM produtos WHERE id = $1", [id]);
  await registrarEvento({
    usuarioId: user.id,
    usuarioNome: user.nome,
    tipo: "exclusao",
    modulo: "produtos",
    detalhes: `Removeu produto #${id}.`,
  });
  return NextResponse.json({ ok: true });
}
