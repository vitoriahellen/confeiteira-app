import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { registrarEvento } from "@/lib/auditoria";

export async function PUT(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (user.papel !== "admin") {
    return NextResponse.json({ error: "Apenas administradores podem editar usuários." }, { status: 403 });
  }

  const { id } = await params;
  const { nome, telefone, senha, permissoes } = await request.json();

  const sets = [];
  const valores = [];

  if (nome) {
    valores.push(nome);
    sets.push(`nome = $${valores.length}`);
  }
  if (telefone !== undefined) {
    valores.push(telefone);
    sets.push(`telefone = $${valores.length}`);
  }
  if (permissoes !== undefined) {
    valores.push(JSON.stringify(permissoes));
    sets.push(`permissoes = $${valores.length}::jsonb`);
  }
  if (senha) {
    if (senha.length < 6) {
      return NextResponse.json({ error: "A senha deve ter ao menos 6 caracteres." }, { status: 400 });
    }
    const senhaHash = await hashPassword(senha);
    valores.push(senhaHash);
    sets.push(`senha_hash = $${valores.length}`);
  }

  if (!sets.length) {
    return NextResponse.json({ error: "Nenhum campo para atualizar." }, { status: 400 });
  }

  valores.push(id);
  const result = await query(
    `UPDATE usuarios SET ${sets.join(", ")} WHERE id = $${valores.length}
     RETURNING id, nome, email, papel, telefone, permissoes`,
    valores
  );

  if (!result.rows.length) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  await registrarEvento({
    usuarioId: user.id,
    usuarioNome: user.nome,
    tipo: "edicao",
    modulo: "usuarios",
    detalhes: `Editou usuária #${id}${permissoes !== undefined ? " (permissões atualizadas)" : ""}.`,
  });

  return NextResponse.json({ usuario: result.rows[0] });
}

export async function DELETE(_request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (user.papel !== "admin") {
    return NextResponse.json({ error: "Apenas administradores podem remover usuários." }, { status: 403 });
  }

  const { id } = await params;

  if (Number(id) === Number(user.id)) {
    return NextResponse.json({ error: "Você não pode remover a si mesmo." }, { status: 400 });
  }

  const check = await query("SELECT papel FROM usuarios WHERE id = $1", [id]);
  if (check.rows[0]?.papel === "admin") {
    const admins = await query("SELECT COUNT(*)::int AS count FROM usuarios WHERE papel = 'admin'");
    if (admins.rows[0].count <= 1) {
      return NextResponse.json({ error: "Precisa existir ao menos um administrador." }, { status: 400 });
    }
  }

  await query("DELETE FROM usuarios WHERE id = $1", [id]);
  await registrarEvento({
    usuarioId: user.id,
    usuarioNome: user.nome,
    tipo: "exclusao",
    modulo: "usuarios",
    detalhes: `Removeu usuária #${id}.`,
  });
  return NextResponse.json({ ok: true });
}
